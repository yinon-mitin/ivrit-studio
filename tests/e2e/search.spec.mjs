// Search (SPEC Search): the header field finds entries by Hebrew with or without nikud, reading or
// translation, across every part; results link to their place; Escape and following a link clear it.
import { test, expect } from '@playwright/test';
import { open, readParts, expectNoSeriousAxe, expectNoHorizontalOverflow } from './helpers.mjs';
import { stripNikud } from '../../assets/js/core/hebrew.js';

const sections = readParts().flatMap((part) => part.sections.map((section) => ({ ...section, part: part.id })));
const find = (id) => sections.flatMap((s) => s.items.map((item) => ({ ...item, section: s.id, part: s.part }))).find((i) => i.id === id);
const france = find('countries.france');
const safa = find('vocab.safa');

/** Opens the field (a button on a phone, always there on a laptop) and types the query. */
async function searchFor(page, query) {
  const input = page.locator('#search-input');
  if (!(await input.isVisible())) await page.locator('[data-action="search"]').click();
  await input.fill(query);
  await expect(page.locator('#content [data-screen="search"]')).toBeVisible();
  await page.locator('#app[data-ready="true"]').waitFor();
}

test('typing a translation shows matching entries from every part, with a count and a link to each place', async ({ page }) => {
  await open(page, '#/');
  await searchFor(page, 'fra');
  const results = page.locator('#content [data-screen="search"]');
  await expect(results.locator(`[data-entry="${france.id}"]`)).toContainText(france.he);
  await expect(results.locator('[data-entry]', { hasText: 'Austria' })).toHaveCount(0);
  const count = await results.locator('[data-entry]').count();
  await expect(results.locator('.results-summary')).toHaveText(`${count} result${count === 1 ? '' : 's'} for “fra”`);
  await expect(page.locator('#search [role="status"]')).toHaveText(`${count} result${count === 1 ? '' : 's'} for “fra”`);

  await results.locator(`[data-section="${france.section}"] .results-where`).click();
  await expect(page.locator('#content [data-screen="part"]')).toHaveAttribute('data-part', france.part);
  await expect(page.locator(`#${france.section} .section-title`)).toBeInViewport();
  await expect(page.locator('#search-input')).toHaveValue('');
});

test('Hebrew without nikud finds the entry written with nikud', async ({ page }) => {
  await open(page, '#/');
  await searchFor(page, stripNikud(safa.he));
  await expect(page.locator(`#content [data-screen="search"] [data-entry="${safa.id}"]`)).toBeVisible();
});

test('a query with no match says so; Escape clears the search and brings the page back', async ({ page }) => {
  await open(page, `#/${france.part}`);
  await searchFor(page, 'qqqzzz');
  await expect(page.locator('#content .results-summary')).toHaveText('Nothing found for “qqqzzz”.');
  await page.locator('#search-input').press('Escape');
  await expect(page.locator('#content [data-screen="part"]')).toHaveAttribute('data-part', france.part);
  await expect(page.locator('#search-input')).toHaveValue('');
});

test('"/" opens and focuses the search field', async ({ page }) => {
  await open(page, '#/');
  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toBeFocused();
  await expect(page.locator('#search-input')).toHaveValue('');
});

test('results follow the language and pass axe in both themes without horizontal overflow', async ({ page }) => {
  await open(page, '#/');
  await page.locator('[data-setting="lang"] [data-value="ru"]').click();
  await searchFor(page, 'фран');
  await expect(page.locator(`#content [data-entry="${france.id}"]`)).toContainText(france.ru);
  await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Поиск…');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAxe(page);
  }
});
