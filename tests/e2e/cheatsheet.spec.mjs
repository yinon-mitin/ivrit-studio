// Cheatsheet screens, for every section tab in data/: tabs, entries, Hebrew markup, cursive font.
import { test, expect } from '@playwright/test';
import { sectionRoutes, open } from './helpers.mjs';

const LETTER_VIEWS = ['letter-grid', 'letter-rows'];

for (const route of sectionRoutes()) {
  test(`${route.hash} shows its tab, its entries and Hebrew as lang="he" dir="rtl"`, async ({ page }) => {
    await open(page, route.hash);

    await expect(page.locator('#content [data-screen="section"] h2')).not.toBeEmpty();
    await expect(page.locator('#content nav a')).toHaveCount(route.tabs.length);
    if (route.tab !== null) {
      await expect(page.locator('#content nav a[aria-current="page"]')).toHaveAttribute('href', `#/${route.section}/${route.tab}`);
    }
    await expect(page.locator(`#content [data-view="${route.view}"] [data-entry]`)).toHaveCount(route.count);

    const unmarked = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT);
      const found = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const el = node.parentElement;
        const marked = el.closest('[lang]')?.lang === 'he' && el.closest('[dir]')?.dir === 'rtl';
        if (/[֐-׿]/.test(node.data) && !marked) found.push(node.data);
      }
      return found;
    });
    expect(unmarked).toEqual([]);
  });

  if (LETTER_VIEWS.includes(route.view) && route.count > 0) {
    test(`${route.hash} draws cursive letters in Gveret Levin`, async ({ page }) => {
      await open(page, route.hash);
      const cursive = page.locator('#content .glyph-cursive').first();
      await expect(cursive).toHaveCSS('font-family', /^"?Gveret Levin"?,/);
      const text = await cursive.textContent();
      expect(await page.evaluate((t) => document.fonts.check('32px "Gveret Levin"', t), text)).toBe(true);
    });
  }
}

for (const route of sectionRoutes().filter((r) => r.tabs.length > 0 && r.tab === r.tabs[0])) {
  test(`#/${route.section} and an unknown tab show the first tab`, async ({ page }) => {
    for (const hash of [`#/${route.section}`, `#/${route.section}/no-such-tab`]) {
      await open(page, hash);
      await expect(page.locator('#content nav a[aria-current="page"]')).toHaveAttribute('href', route.hash);
    }
  });
}
