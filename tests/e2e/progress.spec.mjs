// Progress screen: export (file, text) and import (text, file) between devices; imports merge, and
// a bad import changes nothing.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open, openMenu } from './helpers.mjs';

const KEY = 'ivrit-studio:progress';
const card = (box, lastSeen) => ({ box, seen: 2, wrong: 1, lastSeen, confusedWith: {} });
const file = (cards, extra = {}) => JSON.stringify({ app: 'ivrit-studio', version: 1, exportedAt: '2026-10-19T12:00:00Z', cards, ...extra });
const PHONE = { 'alphabet.alef|print-to-name': card(3, '2026-10-19T09:00:00Z'), 'shared|t': card(2, '2026-10-19T11:00:00Z') };
const LAPTOP = { 'countries.france|he-to-meaning': card(1, '2026-10-19T08:00:00Z'), 'shared|t': card(5, '2026-10-19T10:00:00Z') };

const seedProgress = (page, cards) => page.addInitScript(([key, value]) => {
  if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
}, [KEY, file(cards)]);
const stored = (page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const status = (page) => page.locator('#content [data-progress="status"]');
const importText = async (page, text) => {
  await page.locator('#content [data-progress="paste"]').fill(text);
  await page.locator('#content [data-action="import"]').click();
};

test('the ⚙ menu leads to the progress screen, which summarises the cards', async ({ page }) => {
  await seedProgress(page, PHONE);
  await open(page, '#/');
  await openMenu(page);
  await page.locator('[data-setting="menu"] a[href="#/progress"]').click();
  await expect(page.locator('#content [data-screen="progress"]')).toBeVisible();
  await expect(page.locator('#content [data-progress="practised"]')).toHaveText('2');
  await expect(page.locator('#content [data-progress="learned"]')).toHaveText('0');
});

test('export on one device, import on another: both devices’ cards, the newer record per card', async ({ browser }) => {
  const phone = await browser.newContext();
  const phonePage = await phone.newPage();
  await seedProgress(phonePage, PHONE);
  await open(phonePage, '#/progress');
  const [download] = await Promise.all([phonePage.waitForEvent('download'), phonePage.locator('#content [data-action="download"]').click()]);
  expect(download.suggestedFilename()).toMatch(/^ivrit-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = readFileSync(await download.path(), 'utf8');
  await phone.close();

  const laptop = await browser.newContext();
  const laptopPage = await laptop.newPage();
  await seedProgress(laptopPage, LAPTOP);
  await open(laptopPage, '#/progress');
  await importText(laptopPage, exported);
  await expect(status(laptopPage)).toHaveAttribute('data-state', 'ok');
  const merged = JSON.parse(await stored(laptopPage)).cards;
  expect(Object.keys(merged).sort()).toEqual(['alphabet.alef|print-to-name', 'countries.france|he-to-meaning', 'shared|t']);
  expect(merged['shared|t'].box).toBe(2);
  await expect(laptopPage.locator('#content [data-progress="practised"]')).toHaveText('3');
  await laptop.close();
});

test('copy as text puts the export on the clipboard', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = null;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.copied = text; } } });
  });
  await seedProgress(page, PHONE);
  await open(page, '#/progress');
  await page.locator('#content [data-action="copy"]').click();
  await expect(status(page)).toHaveAttribute('data-state', 'ok');
  const copied = JSON.parse(await page.evaluate(() => window.copied));
  expect(copied).toMatchObject({ app: 'ivrit-studio', version: 1, cards: PHONE });
});

test('importing a file merges it too', async ({ page }) => {
  await seedProgress(page, LAPTOP);
  await open(page, '#/progress');
  await page.locator('#content [data-progress="file"]').setInputFiles({ name: 'phone.json', mimeType: 'application/json', buffer: Buffer.from(file(PHONE)) });
  await page.locator('#content [data-action="import"]').click();
  await expect(status(page)).toHaveAttribute('data-state', 'ok');
  expect(Object.keys(JSON.parse(await stored(page)).cards)).toHaveLength(3);
});

for (const [name, text, message] of [
  ['broken text', '{ "app": "ivrit-studio", ', /not a progress file/],
  ['a file from another app', JSON.stringify({ app: 'anki', version: 1, cards: {} }), /not from Ivrit Studio/],
  ['a newer version', file({}, { version: 2 }), /newer version/],
  ['impossible values', file({ x: card(9, '2026-10-19T09:00:00Z') }), /damaged/],
  ['nothing', '', /Paste the text or choose a file/],
]) {
  test(`importing ${name} explains the problem and leaves local progress unchanged`, async ({ page }) => {
    await seedProgress(page, LAPTOP);
    await open(page, '#/progress');
    const before = await stored(page);
    await importText(page, text);
    await expect(status(page)).toHaveAttribute('data-state', 'error');
    await expect(status(page)).toContainText(message);
    expect(await stored(page)).toBe(before);
  });
}
