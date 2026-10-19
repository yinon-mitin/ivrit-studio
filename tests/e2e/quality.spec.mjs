// CONSTRAINTS.md checks over every route in data/: one screen, axe in both themes, no external
// requests, no page errors; plus first-load weight and font size budgets.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  routes, open, expectOneScreen, expectNoSeriousAxe, recordRequests, externalRequests, fontFiles, FONTS_DIR, seedSettings,
} from './helpers.mjs';

const KB = 1024;

for (const route of routes()) {
  test(`${route} fits one screen with RU on and nikud on/off, passes axe in both themes, stays on the site`, async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests = recordRequests(page);

    // Densest mode (SPEC): RU translations shown.
    await seedSettings(page, { showRu: true });
    await page.emulateMedia({ colorScheme: 'light' });
    await open(page, route);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectOneScreen(page);
      await expectNoSeriousAxe(page);
    }
    await page.locator('[data-setting="nikud"]').click();
    await page.locator('#app[data-ready="true"]').waitFor();
    await expectOneScreen(page);

    expect(externalRequests(requests, baseURL)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('first load transfers at most 200 KB', async ({ page }) => {
  const sizes = [];
  page.on('requestfinished', (request) => {
    sizes.push(request.sizes().then((s) => s.responseHeadersSize + s.responseBodySize));
  });
  await open(page, '#/');
  const total = (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
  expect(total).toBeGreaterThan(0);
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
