// Install offer (SPEC Install): on a touch phone, from the second visit or after 30 s, a banner offers
// the browser's install prompt (Android) or tells how to add the site to the home screen (iOS). A
// dismissal keeps it away for 30 days; it never shows in the installed app or on a laptop.
import { test, expect } from '@playwright/test';
import { open, seedSettings, expectNoHorizontalOverflow, expectNoSeriousAxe } from './helpers.mjs';

const KEY = 'ivrit-studio:install';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const banner = (page) => page.locator('#install');

/** Loads the site, then makes the next load of it a second visit, a day later. */
async function becomeReturning(page) {
  await open(page, '#/');
  await page.evaluate((key) => {
    const day = Date.now() - 24 * 3600 * 1000;
    window.localStorage.setItem(key, JSON.stringify({ visits: 1, firstSeen: day, lastSeen: day, dismissedAt: 0, installed: false }));
  }, KEY);
  await page.reload();
  await page.locator('#app[data-ready="true"]').waitFor();
}

/** What Chrome on Android sends when the site can be installed, with a prompt() that counts its calls. */
const offerInstall = (page) => page.evaluate(() => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  event.prompt = () => { window.promptCalls = (window.promptCalls ?? 0) + 1; return Promise.resolve(); };
  event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
  window.dispatchEvent(event);
});

test.describe('on an Android phone', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

  test('a returning visitor is offered the install; Install calls the browser prompt and the banner goes', async ({ page }) => {
    await becomeReturning(page);
    await expect(banner(page)).toBeHidden();
    await offerInstall(page);
    await expect(banner(page)).toBeVisible();
    await banner(page).getByRole('button', { name: 'Install' }).click();
    await expect.poll(() => page.evaluate(() => window.promptCalls)).toBe(1);
    await expect(banner(page)).toBeHidden();
    const state = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)), KEY);
    expect(state.installed).toBe(true);
  });

  test('Not now hides it, and a reload within 30 days does not bring it back', async ({ page }) => {
    await becomeReturning(page);
    await offerInstall(page);
    await banner(page).getByRole('button', { name: 'Not now' }).click();
    await expect(banner(page)).toBeHidden();
    await page.reload();
    await page.locator('#app[data-ready="true"]').waitFor();
    await offerInstall(page);
    await page.evaluate(() => new Promise((resolve) => { setTimeout(resolve, 200); }));
    await expect(banner(page)).toBeHidden();
  });

  test('a first visit gets the offer only after 30 s', async ({ page }) => {
    await page.clock.install();
    await open(page, '#/');
    await offerInstall(page);
    await page.clock.fastForward(29_000);
    await expect(banner(page)).toBeHidden();
    await page.clock.fastForward(2_000);
    await expect(banner(page)).toBeVisible();
  });

  test('the installed app is not offered to install itself', async ({ page }) => {
    await page.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => (query.includes('display-mode: standalone')
        ? Object.create(matchMedia('all'), { matches: { value: true }, media: { value: query } })
        : matchMedia(query));
    });
    await becomeReturning(page);
    await offerInstall(page);
    await page.evaluate(() => new Promise((resolve) => { setTimeout(resolve, 200); }));
    await expect(banner(page)).toBeHidden();
  });

  test('the banner fits the screen, stays below the header, is not printed, and passes axe in both themes and languages', async ({ page }) => {
    await seedSettings(page, { lang: 'ru' });
    await becomeReturning(page);
    await offerInstall(page);
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Установить' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const [bannerTop, headerBottom, bannerBottom] = await page.evaluate(() => [
      document.getElementById('install').getBoundingClientRect().top,
      document.querySelector('.app-header').getBoundingClientRect().bottom,
      document.getElementById('install').getBoundingClientRect().bottom,
    ]);
    expect(bannerTop).toBeGreaterThan(headerBottom + 120);
    expect(bannerBottom).toBeLessThanOrEqual(640);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectNoSeriousAxe(page);
    }
    await page.emulateMedia({ media: 'print' });
    await expect(banner(page)).toBeHidden();
  });
});

test.describe('on an iPhone', () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true, userAgent: IPHONE });

  test('a returning visitor is told to use Share and Add to Home Screen; there is no Install button', async ({ page }) => {
    await becomeReturning(page);
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText('Add to Home Screen');
    await expect(banner(page).getByRole('button', { name: 'Install' })).toHaveCount(0);
    await banner(page).getByRole('button', { name: 'Got it' }).click();
    await expect(banner(page)).toBeHidden();
  });
});

test.describe('on a laptop', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('no offer, even for a returning visitor whose browser can install', async ({ page }) => {
    await becomeReturning(page);
    await offerInstall(page);
    await page.evaluate(() => new Promise((resolve) => { setTimeout(resolve, 200); }));
    await expect(banner(page)).toBeHidden();
  });
});
