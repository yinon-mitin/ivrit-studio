// List view features used by colours and numbers, checked on a fixture section served in place of
// data/ so they do not depend on real content: colour swatches, and forms tables without the columns
// no form fills.
import { test, expect } from '@playwright/test';
import { open, expectNoSeriousAxe, expectNoHorizontalOverflow } from './helpers.mjs';

const entry = (slug, extra) => ({ id: `fixture.${slug}`, translit: slug, ru: slug, verified: false, ...extra });
const SECTION = {
  id: 'fixture', title: { en: 'Fixture', ru: 'Проба' }, view: 'list',
  items: [
    entry('red', { he: 'אָדֹם', en: 'red', swatch: '#d32f2f', forms: { ms: 'אָדֹם', fs: 'אֲדֻמָּה', mp: 'אֲדֻמִּים', fp: 'אֲדֻמּוֹת' } }),
    entry('white', { he: 'לָבָן', en: 'white', swatch: '#fff' }),
    entry('three', { he: 'שָׁלוֹשׁ', en: '3 — three', forms: { ms: 'שְׁלוֹשָׁה', fs: 'שָׁלוֹשׁ' } }),
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/data/index.json', (route) => route.fulfill({
    json: { parts: [{ id: 'test', title: { en: 'Test', ru: 'Тест' }, sections: ['fixture'] }] },
  }));
  await page.route('**/data/sections/fixture.json', (route) => route.fulfill({ json: SECTION }));
});

test('a swatch entry shows a chip in its colour, hidden from screen readers', async ({ page }) => {
  await open(page, '#/test');
  const chip = page.locator('[data-entry="fixture.red"] .entry-swatch');
  await expect(chip).toHaveCSS('background-color', 'rgb(211, 47, 47)');
  await expect(chip).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-entry="fixture.white"] .entry-swatch')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('[data-entry="fixture.three"] .entry-swatch')).toHaveCount(0);
});

test('forms with only masculine and feminine show one column and no dashes; full forms show both', async ({ page }) => {
  await open(page, '#/test');
  const three = page.locator('[data-entry="fixture.three"] .entry-forms');
  await expect(three.locator('thead th')).toHaveText(['Singular']);
  await expect(three.locator('tbody td')).toHaveText(['שְׁלוֹשָׁה', 'שָׁלוֹשׁ']);
  await expect(three).not.toContainText('—');
  await expect(page.locator('[data-entry="fixture.red"] .entry-forms thead th')).toHaveText(['Singular', 'Plural']);
});

test('no horizontal overflow and axe clean in both themes', async ({ page }) => {
  await open(page, '#/test');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAxe(page);
  }
});
