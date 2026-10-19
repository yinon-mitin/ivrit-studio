// Settings: nikud toggle in the header; theme, interface language and RU translation in the ⚙ menu.
// All remembered in localStorage; the site keeps working when storage is unavailable or broken.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open, openMenu, sectionRoutes, expectNoSeriousAxe, SETTINGS_KEY } from './helpers.mjs';
import { displayHe } from '../../assets/js/core/hebrew.js';

const LIGHT_BG = 'rgb(255, 255, 255)';
const DARK_BG = 'rgb(20, 22, 26)';
const firstSection = (() => {
  const index = JSON.parse(readFileSync(new URL('../../data/index.json', import.meta.url), 'utf8'));
  return JSON.parse(readFileSync(new URL(`../../data/sections/${index.sections[0]}.json`, import.meta.url), 'utf8'));
})();
// A tab whose Hebrew changes without nikud, and one in a section that keeps its nikud (the alphabet).
const togglable = sectionRoutes().find((r) => r.nikudToggle && r.items.some((i) => displayHe(i, false) !== i.he));
const fixed = sectionRoutes().find((r) => !r.nikudToggle && r.items.some((i) => displayHe(i, false) !== i.he));

const background = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const ready = (page) => page.locator('#app[data-ready="true"]').waitFor();
const recordErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.describe('theme', () => {
  test('follows prefers-color-scheme while set to Auto', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '#/');
    await openMenu(page);
    await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Theme: Auto');
    expect(await background(page)).toBe(DARK_BG);
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await background(page)).toBe(LIGHT_BG);
  });

  test('the toggle cycles Auto → Light → Dark → Auto, overrides the system and is remembered', async ({ page }) => {
    const toggle = page.locator('[data-setting="theme"]');
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '#/');
    await openMenu(page);

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    expect(await background(page)).toBe(LIGHT_BG);

    await page.emulateMedia({ colorScheme: 'light' });
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    expect(await background(page)).toBe(DARK_BG);

    await page.reload();
    await ready(page);
    await openMenu(page);
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    expect(await background(page)).toBe(DARK_BG);

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Auto');
    expect(await background(page)).toBe(LIGHT_BG);
  });

  test('home in both themes (screenshots attached to the report)', async ({ page }, testInfo) => {
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await open(page, '#/');
      await testInfo.attach(`home-${colorScheme}`, { body: await page.screenshot(), contentType: 'image/png' });
    }
  });
});

test.describe('interface language', () => {
  test.describe('in a Russian browser', () => {
    test.use({ locale: 'ru-RU' });

    test('defaults to Russian', async ({ page }) => {
      await open(page, '#/');
      await expect(page.locator('#home-title')).toHaveText('Разделы');
      await expect(page.locator(`#content a[data-section="${firstSection.id}"]`)).toHaveText(firstSection.title.ru);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    });
  });

  test('defaults to English in an English browser', async ({ page }) => {
    await open(page, '#/');
    await expect(page.locator('#home-title')).toHaveText('Sections');
    await openMenu(page);
    await expect(page.locator('[data-setting="uiLang"] [data-value="en"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('switching to RU relabels the interface and section titles, keeps focus, and is remembered', async ({ page }) => {
    await open(page, '#/');
    await openMenu(page);
    // Keyboard activation: WebKit does not focus buttons on mouse click, and focus restoration is for keyboard users.
    await page.locator('[data-setting="uiLang"] [data-value="ru"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#home-title')).toHaveText('Разделы');
    await expect(page.locator('[data-setting="uiLang"] [data-value="ru"]')).toBeFocused();
    await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Тема: Авто');
    await expect(page.locator('[data-setting="nikud"]')).toHaveText('Огласовки');

    await open(page, `#/${firstSection.id}`);
    await expect(page.locator('#content h2')).toHaveText(firstSection.title.ru);
    if (firstSection.tabs) await expect(page.locator('#content nav a').first()).toHaveText(firstSection.tabs[0].title.ru);

    await page.reload();
    await ready(page);
    await expect(page.locator('#content h2')).toHaveText(firstSection.title.ru);
  });
});

test.describe('nikud', () => {
  test('the header toggle removes nikud where the section allows it, and is remembered', async ({ page }) => {
    const item = togglable.items.find((i) => displayHe(i, false) !== i.he);
    const entry = page.locator(`#content [data-entry="${item.id}"]`);
    const toggle = page.locator('[data-setting="nikud"]');
    await open(page, togglable.hash);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(entry).toContainText(item.he);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(entry).toContainText(displayHe(item, false));
    await expect(entry).not.toContainText(item.he);

    await page.reload();
    await ready(page);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(entry).toContainText(displayHe(item, false));
  });

  test('a section with nikudToggle false keeps its nikud', async ({ page }) => {
    const item = fixed.items.find((i) => displayHe(i, false) !== i.he);
    await open(page, fixed.hash);
    await page.locator('[data-setting="nikud"]').click();
    await ready(page);
    await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator(`#content [data-entry="${item.id}"]`)).toContainText(item.he);
  });
});

test('the RU translation setting adds Russian to every entry and is remembered', async ({ page }) => {
  const route = sectionRoutes()[0];
  const entry = page.locator(`#content [data-entry="${route.items[0].id}"]`);
  await open(page, route.hash);
  await expect(entry).not.toContainText(route.items[0].ru);
  await openMenu(page);
  const toggle = page.locator('[data-setting="showRu"]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (const item of route.items) await expect(page.locator(`#content [data-entry="${item.id}"]`)).toContainText(item.ru);

  await page.reload();
  await ready(page);
  await expect(entry).toContainText(route.items[0].ru);
});

test.describe('settings menu', () => {
  test('passes axe while open, in both themes', async ({ page }) => {
    await open(page, '#/');
    await openMenu(page);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectNoSeriousAxe(page);
    }
  });

  test('closes on Escape, returning focus to its button, and on a click outside', async ({ page }) => {
    const menu = page.locator('[data-setting="menu"]');
    await open(page, '#/');
    await openMenu(page);
    await page.locator('[data-setting="theme"]').focus();
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(menu.locator('summary')).toBeFocused();

    await openMenu(page);
    await page.locator('#content').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveAttribute('open', '');
  });
});

test('works for the session when localStorage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
  });
  const errors = recordErrors(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, '#/');
  await openMenu(page);
  await page.locator('[data-setting="theme"]').click();
  await page.locator('[data-setting="theme"]').click();
  expect(await background(page)).toBe(DARK_BG);
  await page.locator('[data-setting="uiLang"] [data-value="ru"]').click();
  await expect(page.locator('#home-title')).toHaveText('Разделы');
  await page.locator('[data-setting="nikud"]').click();
  await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('ignores a broken stored settings value', async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, '{ "theme": '), SETTINGS_KEY);
  const errors = recordErrors(page);
  await open(page, '#/');
  await expect(page.locator('#home-title')).toHaveText('Sections');
  await expect(page.locator('[data-setting="nikud"]')).toHaveAttribute('aria-pressed', 'true');
  await openMenu(page);
  await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Theme: Auto');
  expect(errors).toEqual([]);
});
