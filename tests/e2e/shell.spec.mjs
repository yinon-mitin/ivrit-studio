// App shell behaviour: the contents lists the parts and sections from data/index.json; old and unknown
// routes land somewhere sensible.
import { test, expect } from '@playwright/test';
import { open, readParts, seedSettings } from './helpers.mjs';

const parts = readParts();

test('the contents shows the app name and one link per section in index.json', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ivrit Studio');
  await expect(page.locator('#content a[data-section]')).toHaveCount(parts.flatMap((part) => part.sections).length);
});

test('an unknown route shows the contents', async ({ page }) => {
  await open(page, '#/no-such-section/x/y');
  await expect(page.locator('#content [data-screen="contents"]')).toBeVisible();
});

test('old section, Blitz and progress links open the section in its part, and the contents', async ({ page }) => {
  for (const hash of ['#/alphabet', '#/alphabet/blitz']) {
    await open(page, hash);
    await expect(page.locator('#content [data-screen="part"]')).toHaveAttribute('data-part', 'reading');
    await expect(page.locator('#alphabet .section-title')).toBeInViewport();
  }
  await open(page, '#/countries/asia');
  await expect(page.locator('#countries-asia .group-title')).toBeInViewport();
  await open(page, '#/progress');
  await expect(page.locator('#content [data-screen="contents"]')).toBeVisible();
});

test('the page is not indexed and allows only same-origin resources', async ({ page }) => {
  await open(page, '#/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /default-src 'self'/);
});

test.describe('the GitHub link', () => {
  const link = (page) => page.locator('#content a.contents-source');

  test('is on the contents only, opens the project in a new tab and follows the language', async ({ page }) => {
    await open(page, '#/');
    await expect(link(page)).toHaveText('Source on GitHub');
    await expect(link(page)).toHaveAttribute('href', 'https://github.com/yinon-mitin/ivrit-studio');
    await expect(link(page)).toHaveAttribute('target', '_blank');
    await expect(link(page)).toHaveAttribute('rel', 'noopener noreferrer');
    await open(page, `#/${parts[0].id}`);
    await expect(link(page)).toHaveCount(0);
    await page.keyboard.press('/');
    await page.keyboard.type('a');
    await expect(page.locator('#content [data-screen="search"]')).toBeVisible();
    await expect(link(page)).toHaveCount(0);
  });

  test('is in Russian when the language is Russian, and is not printed', async ({ page }) => {
    await seedSettings(page, { lang: 'ru' });
    await open(page, '#/');
    await expect(link(page)).toHaveText('Исходный код на GitHub');
    await page.emulateMedia({ media: 'print' });
    await expect(link(page)).toBeHidden();
  });

  test('is quiet: small, muted and below the sections', async ({ page }) => {
    await open(page, '#/');
    const [fontSize, linkTop, listBottom] = await page.evaluate(() => [
      parseFloat(getComputedStyle(document.querySelector('.contents-source')).fontSize),
      document.querySelector('.contents-source').getBoundingClientRect().top,
      document.querySelector('.contents-parts').getBoundingClientRect().bottom,
    ]);
    expect(fontSize).toBeLessThanOrEqual(14);
    expect(linkTop).toBeGreaterThanOrEqual(listBottom);
  });
});
