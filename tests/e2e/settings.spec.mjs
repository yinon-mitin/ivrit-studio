// Settings in the header: nikud, the EN/RU switch (interface and translations together) and the theme.
// All remembered in localStorage; the site keeps working when storage is unavailable or broken.
import { test, expect } from '@playwright/test';
import { open, sectionRoutes, readParts, expectNoSeriousAxe, SETTINGS_KEY } from './helpers.mjs';
import { displayHe } from '../../assets/js/core/hebrew.js';

// The --paper token of each theme (assets/css/app.css).
const LIGHT_BG = 'rgb(246, 242, 233)';
const DARK_BG = 'rgb(24, 22, 19)';
const firstPart = readParts()[0];
const firstSection = firstPart.sections[0];
// A section whose Hebrew changes without nikud, and one that keeps its nikud (the alphabet).
const togglable = sectionRoutes().find((r) => r.nikudToggle && r.items.some((i) => displayHe(i, false) !== i.he));
const fixed = sectionRoutes().find((r) => !r.nikudToggle && r.items.some((i) => displayHe(i, false) !== i.he));
// A section with list or table entries, where the translation is shown in full.
const translated = sectionRoutes().find((r) => r.groups.every((g) => ['card-grid', 'table'].includes(g.view)));

const background = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const ready = (page) => page.locator('#app[data-ready="true"]').waitFor();
const recordErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};
const entry = (page, id) => page.locator(`#content [data-entry="${id}"]`).first();

test.describe('theme', () => {
  test('follows prefers-color-scheme while set to Auto', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '#/');
    await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Theme: Auto');
    expect(await background(page)).toBe(DARK_BG);
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await background(page)).toBe(LIGHT_BG);
  });

  test('the toggle cycles Auto → Light → Dark → Auto, overrides the system and is remembered', async ({ page }) => {
    const toggle = page.locator('[data-setting="theme"]');
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '#/');

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    expect(await background(page)).toBe(LIGHT_BG);

    await page.emulateMedia({ colorScheme: 'light' });
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    expect(await background(page)).toBe(DARK_BG);

    await page.reload();
    await ready(page);
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    expect(await background(page)).toBe(DARK_BG);

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Auto');
    expect(await background(page)).toBe(LIGHT_BG);
  });

  test('contents in both themes (screenshots attached to the report)', async ({ page }, testInfo) => {
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await open(page, '#/');
      await testInfo.attach(`contents-${colorScheme}`, { body: await page.screenshot(), contentType: 'image/png' });
    }
  });
});

test.describe('language', () => {
  test.describe('in a Russian browser', () => {
    test.use({ locale: 'ru-RU' });

    test('still starts in English', async ({ page }) => {
      await open(page, '#/');
      await expect(page.locator('#contents-title')).toHaveText('Contents');
      await expect(page.locator('[data-setting="lang"] [data-value="en"]')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('RU switches the interface, titles and every translation to Russian, keeps focus, and is remembered', async ({ page }) => {
    await open(page, translated.hash);
    for (const item of translated.items) {
      await expect(entry(page, item.id)).toContainText(item.en);
    }
    // Keyboard activation: WebKit does not focus buttons on mouse click, and focus restoration is for keyboard users.
    await page.locator('[data-setting="lang"] [data-value="ru"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-setting="lang"] [data-value="ru"]')).toBeFocused();
    await expect(page.locator('[data-setting="lang"] [data-value="ru"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-setting="nikud"]')).toHaveText('Огласовки');
    await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Тема: Авто');
    await expect(page.locator(`#${translated.section} .section-title`)).toHaveText(translated.title.ru);
    for (const item of translated.items) {
      await expect(entry(page, item.id)).toContainText(item.ru);
      if (item.en !== item.ru) await expect(entry(page, item.id)).not.toContainText(item.en);
    }

    await page.reload();
    await ready(page);
    await expect(entry(page, translated.items[0].id)).toContainText(translated.items[0].ru);
    await open(page, '#/');
    await expect(page.locator('#contents-title')).toHaveText('Содержание');
    await expect(page.locator(`#content a[data-section="${firstSection.id}"]`)).toContainText(firstSection.title.ru);
    await expect(page.locator('header nav a').first()).toHaveText(firstPart.title.ru);
    if (firstSection.groups) {
      await open(page, `#/${firstPart.id}`);
      await expect(page.locator('#content .group-title').first()).toHaveText(firstSection.groups[0].title.ru);
    }
  });
});

test.describe('nikud', () => {
  test('the header toggle removes nikud where the section allows it, and is remembered', async ({ page }) => {
    const item = togglable.items.find((i) => displayHe(i, false) !== i.he);
    const toggle = page.locator('[data-setting="nikud"]');
    await open(page, togglable.hash);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(entry(page, item.id)).toContainText(item.he);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(entry(page, item.id)).toContainText(displayHe(item, false));
    await expect(entry(page, item.id)).not.toContainText(item.he);

    await page.reload();
    await ready(page);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(entry(page, item.id)).toContainText(displayHe(item, false));
  });

  test('a section with nikudToggle false keeps its nikud', async ({ page }) => {
    const item = fixed.items.find((i) => displayHe(i, false) !== i.he);
    await open(page, fixed.hash);
    await page.locator('[data-setting="nikud"]').click();
    await ready(page);
    await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(entry(page, item.id)).toContainText(item.he);
  });

  test('a settings change keeps the reader in place on a long page', async ({ page }) => {
    await open(page, `${togglable.hash}`);
    const before = await page.evaluate(() => window.scrollY);
    await page.locator('[data-setting="nikud"]').click();
    await ready(page);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(2);
  });
});

test('the header controls pass axe in both themes, in Russian', async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, JSON.stringify({ lang: 'ru' })), SETTINGS_KEY);
  await open(page, `#/${firstPart.id}`);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoSeriousAxe(page);
  }
});

test('works for the session when localStorage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
  });
  const errors = recordErrors(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, '#/');
  await page.locator('[data-setting="theme"]').click();
  await page.locator('[data-setting="theme"]').click();
  expect(await background(page)).toBe(DARK_BG);
  await page.locator('[data-setting="lang"] [data-value="ru"]').click();
  await expect(page.locator('#contents-title')).toHaveText('Содержание');
  await page.locator('[data-setting="nikud"]').click();
  await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('ignores a broken stored settings value', async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, '{ "theme": '), SETTINGS_KEY);
  const errors = recordErrors(page);
  await open(page, '#/');
  await expect(page.locator('#contents-title')).toHaveText('Contents');
  await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Theme: Auto');
  expect(errors).toEqual([]);
});
