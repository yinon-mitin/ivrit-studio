// CONSTRAINTS.md checks over every route in data/: no horizontal overflow, axe in both themes, no external
// requests, no page errors; plus first-load weight and font size budgets.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { test, expect } from '@playwright/test';
import {
  routes, open, expectNoHorizontalOverflow, expectNoSeriousAxe, recordRequests, externalRequests, fontFiles, FONTS_DIR,
} from './helpers.mjs';

const KB = 1024;

for (const route of routes()) {
  test(`${route} has no horizontal overflow in EN and RU and with nikud on/off, passes axe in both themes, stays on the site`, async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests = recordRequests(page);

    await page.emulateMedia({ colorScheme: 'light' });
    await open(page, route);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAxe(page);
    }
    await page.locator('[data-setting="nikud"]').click();
    await page.locator('#app[data-ready="true"]').waitFor();
    await expectNoHorizontalOverflow(page);
    await page.locator('[data-setting="lang"] [data-value="ru"]').click();
    await page.locator('#app[data-ready="true"]').waitFor();
    await expectNoHorizontalOverflow(page);

    expect(externalRequests(requests, baseURL)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

// "Transferred" as the site is served: GitHub Pages gzips text, so text bodies count gzipped; woff2
// is already compressed and counts as is. The local test server does not compress.
const TEXT = /^(text\/|application\/(json|javascript))/;

test('first load transfers at most 200 KB (text gzipped, as GitHub Pages serves it)', async ({ page }) => {
  const sizes = [];
  page.on('requestfinished', (request) => {
    sizes.push((async () => {
      const response = await request.response();
      const body = await response.body();
      const type = response.headers()['content-type'] ?? '';
      return (await request.sizes()).responseHeadersSize + (TEXT.test(type) ? gzipSync(body).length : body.length);
    })());
  });
  await open(page, '#/');
  const total = (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
  expect(total).toBeGreaterThan(0);
  console.log(`first load: ${(total / KB).toFixed(1)} KB transferred`);
  expect(total).toBeLessThanOrEqual(200 * KB);
});

test('every woff2 font served is at most 60 KB', async ({ request }) => {
  const files = fontFiles();
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const response = await request.get(`/assets/fonts/${file}`);
    expect(response.ok()).toBe(true);
    const body = await response.body();
    expect(body.length, file).toBe(readFileSync(join(FONTS_DIR, file)).length);
    expect(body.length, file).toBeLessThanOrEqual(60 * KB);
  }
});
