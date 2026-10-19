// Weeks: entries from data/weeks/*.json join their section under one tab per week, newest first,
// titled by date. Uses fixture data served in place of data/ so it does not depend on real weeks.
import { test, expect } from '@playwright/test';
import { open, seedSettings, expectOneScreen, expectNoSeriousAxe } from './helpers.mjs';

const VOCAB = { id: 'vocab', title: { en: 'Vocabulary', ru: 'Слова' }, view: 'card-grid', items: [] };
const entry = (slug, he, translit, en, ru) => ({ section: 'vocab', id: `vocab.${slug}`, he, translit, en, ru, verified: false });
const WEEKS = {
  '2026-10-04': { week: '2026-10-04', letters: ['א', 'ב'], items: [entry('shalom', 'שָׁלוֹם', 'Shalom', 'hello', 'привет')] },
  '2026-10-11': {
    week: '2026-10-11',
    letters: ['א', 'ב', 'ג'],
    items: [entry('toda', 'תּוֹדָה', 'Toda', 'thank you', 'спасибо'), entry('bayit', 'בַּיִת', 'Bayit', 'house', 'дом')],
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('**/data/index.json', (route) => route.fulfill({ json: { sections: ['vocab'], weeks: Object.keys(WEEKS) } }));
  await page.route('**/data/sections/vocab.json', (route) => route.fulfill({ json: VOCAB }));
  await page.route('**/data/weeks/*.json', (route) => {
    const date = route.request().url().match(/(\d{4}-\d{2}-\d{2})\.json$/)[1];
    return route.fulfill({ json: WEEKS[date] });
  });
});

test('each week becomes a tab of its section, newest first and open by default, titled by date', async ({ page }) => {
  await open(page, '#/vocab');
  await expect(page.locator('#content nav a')).toHaveText(['Week of 11 Oct', 'Week of 4 Oct']);
  await expect(page.locator('#content nav a[aria-current="page"]')).toHaveAttribute('href', '#/vocab/week-2026-10-11');
  await expect(page.locator('#content [data-entry]')).toHaveCount(2);
  await expect(page.locator('#content [data-entry="vocab.toda"]')).toContainText('תּוֹדָה');
});

test('a week tab shows only that week’s entries, on one screen, accessible in both themes', async ({ page }) => {
  await seedSettings(page, { showRu: true });
  await open(page, '#/vocab/week-2026-10-04');
  await expect(page.locator('#content [data-entry]')).toHaveCount(1);
  await expect(page.locator('#content [data-entry="vocab.shalom"]')).toContainText('привет');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectOneScreen(page);
    await expectNoSeriousAxe(page);
  }
});

test('week tab titles follow the interface language', async ({ page }) => {
  await seedSettings(page, { uiLang: 'ru' });
  await open(page, '#/vocab');
  await expect(page.locator('#content nav a')).toHaveText(['Неделя 11 окт.', 'Неделя 4 окт.']);
});
