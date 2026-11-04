// Header fit (SPEC Layout): when the header is short of room the site name is hidden and the cursive mark
// stays, on a laptop as on a phone; the part navigation is never covered by the brand, and the first part
// can always be reached.
import { test, expect } from '@playwright/test';
import { open, readParts, seedSettings, expectNoHorizontalOverflow } from './helpers.mjs';

const part = readParts()[0];
const WIDTHS = [1024, 1100, 1180, 1225, 1280, 1440];

const header = (page) => page.evaluate(() => {
  const box = (selector) => document.querySelector(selector).getBoundingClientRect();
  const list = document.querySelector('.part-nav-list');
  return {
    nameShown: box('.brand-name').width > 2,
    compact: document.querySelector('.app-header').hasAttribute('data-compact'),
    brandRight: box('.brand').right,
    firstLeft: list.firstElementChild.getBoundingClientRect().left,
    scrollLeft: list.scrollLeft,
    listLeft: list.getBoundingClientRect().left,
  };
});

for (const lang of ['en', 'ru']) {
  test(`${lang}: the brand never covers the first part, at any laptop width`, async ({ page }) => {
    await seedSettings(page, { lang });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, `#/${part.id}`);
      await expect.poll(async () => (await header(page)).firstLeft, { message: `${lang} ${width}` }).toBeGreaterThanOrEqual((await header(page)).brandRight - 0.5);
      const measured = await header(page);
      expect(measured.scrollLeft).toBe(0);
      expect(measured.firstLeft).toBeGreaterThanOrEqual(measured.listLeft - 0.5);
      await expectNoHorizontalOverflow(page);
    }
  });
}

test('the name hides when the room runs out and returns when there is room again', async ({ page }) => {
  await seedSettings(page, { lang: 'ru' });
  await page.setViewportSize({ width: 1440, height: 800 });
  await open(page, `#/${part.id}`);
  await expect.poll(async () => (await header(page)).nameShown).toBe(true);
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect.poll(async () => (await header(page)).nameShown).toBe(false);
  await expect(page.locator('.brand-name')).toHaveText('Ivrit Studio');
  await expect(page.locator('.brand-mark')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect.poll(async () => (await header(page)).nameShown).toBe(true);
});

test('with enough room the name stays', async ({ page }) => {
  await seedSettings(page, { lang: 'en' });
  await page.setViewportSize({ width: 1440, height: 800 });
  await open(page, `#/${part.id}`);
  await expect.poll(async () => (await header(page)).nameShown).toBe(true);
  expect((await header(page)).compact).toBe(false);
});
