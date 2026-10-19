// Settings: theme (Auto/Light/Dark) and interface language, remembered in localStorage, and the
// site keeps working when storage is unavailable or holds a broken value.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

const KEY = 'ivrit-studio:settings';
const LIGHT_BG = 'rgb(255, 255, 255)';
const DARK_BG = 'rgb(20, 22, 26)';
const firstSection = (() => {
  const index = JSON.parse(readFileSync(new URL('../../data/index.json', import.meta.url), 'utf8'));
  return JSON.parse(readFileSync(new URL(`../../data/sections/${index.sections[0]}.json`, import.meta.url), 'utf8'));
})();

const background = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const recordErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

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
    await page.locator('#app[data-ready="true"]').waitFor();
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
    await expect(page.locator('[data-setting="uiLang"] [data-value="en"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('switching to RU relabels the interface and section titles, keeps focus, and is remembered', async ({ page }) => {
    await open(page, '#/');
    // Keyboard activation: WebKit does not focus buttons on mouse click, and focus restoration is for keyboard users.
    await page.locator('[data-setting="uiLang"] [data-value="ru"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#home-title')).toHaveText('Разделы');
    await expect(page.locator('[data-setting="uiLang"] [data-value="ru"]')).toBeFocused();
    await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Тема: Авто');

    await open(page, `#/${firstSection.id}`);
    await expect(page.locator('#content h2')).toHaveText(firstSection.title.ru);
    if (firstSection.tabs) await expect(page.locator('#content nav a').first()).toHaveText(firstSection.tabs[0].title.ru);

    await page.reload();
    await page.locator('#app[data-ready="true"]').waitFor();
    await expect(page.locator('#content h2')).toHaveText(firstSection.title.ru);
  });
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
  await page.locator('[data-setting="uiLang"] [data-value="ru"]').click();
  await expect(page.locator('#home-title')).toHaveText('Разделы');
  expect(errors).toEqual([]);
});

test('ignores a broken stored settings value', async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, '{ "theme": '), KEY);
  const errors = recordErrors(page);
  await open(page, '#/');
  await expect(page.locator('[data-setting="theme"]')).toHaveAccessibleName('Theme: Auto');
  await expect(page.locator('#home-title')).toHaveText('Sections');
  expect(errors).toEqual([]);
});
