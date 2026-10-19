// Blitz: setup → 10 questions → results, for every section that has Blitz templates. Answers are
// recorded in ivrit-studio:progress (Leitner box, mistakes, what a card was confused with).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open, seedSettings, expectOneScreen, expectNoSeriousAxe } from './helpers.mjs';

const PROGRESS_KEY = 'ivrit-studio:progress';
const index = JSON.parse(readFileSync(new URL('../../data/index.json', import.meta.url), 'utf8'));
const sections = index.sections
  .map((id) => JSON.parse(readFileSync(new URL(`../../data/sections/${id}.json`, import.meta.url), 'utf8')))
  .filter((section) => (section.blitz ?? []).length > 0);

const storedProgress = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY);
const start = (page) => page.locator('#content [data-action="start"]').click();
const prompt = (page) => page.locator('#content [data-blitz="prompt"]');
const options = (page) => page.locator('#content [data-blitz="option"]');
const next = (page) => page.locator('#content [data-action="next"]');

for (const section of sections) {
  test(`#/${section.id}/blitz fits one screen and passes axe at setup, question and feedback (RU on)`, async ({ page }) => {
    await seedSettings(page, { showRu: true });
    await open(page, `#/${section.id}/blitz`);
    await expect(page.locator('#content [data-screen="blitz"]')).toBeVisible();
    await expectOneScreen(page);
    await expectNoSeriousAxe(page);

    await start(page);
    await expect(page.locator('#content [data-blitz="counter"]')).toContainText('1');
    await expect(options(page)).not.toHaveCount(0);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectOneScreen(page);
      await expectNoSeriousAxe(page);
    }
    await options(page).first().click();
    await expect(next(page)).toBeFocused();
    await expectOneScreen(page);
    await expectNoSeriousAxe(page);
  });
}

test('a session is 10 questions and ends with a score', async ({ page }) => {
  await open(page, '#/alphabet/blitz');
  await start(page);
  for (let i = 1; i <= 10; i += 1) {
    await expect(page.locator('#content [data-blitz="counter"]')).toHaveText(`${i} of 10`);
    await options(page).first().click();
    await next(page).click();
  }
  await expect(page.locator('#content [data-blitz="score"]')).toContainText('of 10');
  await expectOneScreen(page);
  await page.locator('#content [data-action="again"]').click();
  await expect(page.locator('#content [data-blitz="counter"]')).toHaveText('1 of 10');
});

test('a wrong answer marks both options and is saved as a mistake with what it was confused with', async ({ page }) => {
  await open(page, '#/countries/blitz');
  await start(page);
  const asked = await prompt(page).getAttribute('data-entry');
  const template = await prompt(page).getAttribute('data-template');
  const wrong = page.locator(`#content [data-blitz="option"]:not([data-entry="${asked}"])`).first();
  const chosen = await wrong.getAttribute('data-entry');
  await wrong.click();
  await expect(wrong).toHaveAttribute('data-state', 'wrong');
  await expect(page.locator(`#content [data-blitz="option"][data-entry="${asked}"]`)).toHaveAttribute('data-state', 'correct');

  const card = (await storedProgress(page)).cards[`${asked}|${template}`];
  expect(card).toMatchObject({ box: 1, seen: 1, wrong: 1, confusedWith: { [chosen]: 1 } });
});

test('a right answer moves the card up a box', async ({ page }) => {
  await open(page, '#/countries/blitz');
  await start(page);
  const asked = await prompt(page).getAttribute('data-entry');
  const template = await prompt(page).getAttribute('data-template');
  await page.locator(`#content [data-blitz="option"][data-entry="${asked}"]`).click();
  await expect(page.locator(`#content [data-blitz="option"][data-entry="${asked}"]`)).toHaveAttribute('data-state', 'correct');
  expect((await storedProgress(page)).cards[`${asked}|${template}`]).toMatchObject({ box: 1, seen: 1, wrong: 0 });
});

test('choosing one exercise asks only that exercise', async ({ page }) => {
  const countries = sections.find((s) => s.id === 'countries');
  const exercise = countries.blitz[0].id;
  await open(page, '#/countries/blitz');
  await page.locator(`#content [data-template-choice="${exercise}"]`).click();
  await expect(page.locator(`#content [data-template-choice="${exercise}"]`)).toHaveAttribute('aria-pressed', 'true');
  await start(page);
  for (let i = 0; i < 3; i += 1) {
    await expect(prompt(page)).toHaveAttribute('data-template', exercise);
    await options(page).first().click();
    await next(page).click();
  }
});

test('turning nikud off mid-session keeps the session going', async ({ page }) => {
  await open(page, '#/countries/blitz');
  await start(page);
  await options(page).first().click();
  await next(page).click();
  await page.locator('[data-setting="nikud"]').click();
  await expect(page.locator('#content [data-blitz="counter"]')).toHaveText('2 of 10');
});

test('works for the session when localStorage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, '#/alphabet/blitz');
  await start(page);
  await options(page).first().click();
  await next(page).click();
  await expect(page.locator('#content [data-blitz="counter"]')).toHaveText('2 of 10');
  expect(errors).toEqual([]);
});
