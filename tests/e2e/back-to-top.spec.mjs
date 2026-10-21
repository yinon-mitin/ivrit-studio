// Back to top (SPEC Layout): a quiet round button, shown once the page has scrolled more than a screen;
// it returns to the top and hands the focus to the site name. It stays clear of the ruler and the
// flowing titles on a laptop and of the install banner on a phone, and is not printed.
import { test, expect } from '@playwright/test';
import { open, readParts, seedSettings, expectNoHorizontalOverflow, expectNoSeriousAxe } from './helpers.mjs';

const part = readParts().find((p) => p.sections.length >= 3);
const button = (page) => page.locator('button.to-top');
const scrollTo = (page, screens) => page.evaluate((n) => window.scrollTo(0, window.innerHeight * n), screens);
const boxOf = (locator) => locator.evaluate((node) => {
  const { left, top, right, bottom } = node.getBoundingClientRect();
  return { left, top, right, bottom };
});
const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test('is hidden at the top and within the first screen, and shows after more than a screen', async ({ page }) => {
  await open(page, `#/${part.id}`);
  await expect(button(page)).toBeHidden();
  await scrollTo(page, 0.8);
  await expect(button(page)).toBeHidden();
  await scrollTo(page, 1.5);
  await expect(button(page)).toBeVisible();
  await expect(button(page)).toHaveAccessibleName('Back to top');
  await scrollTo(page, 0);
  await expect(button(page)).toBeHidden();
});

test('a click returns to the top, hands the focus to the site name and the button goes', async ({ page }) => {
  await open(page, `#/${part.id}`);
  await scrollTo(page, 2);
  await button(page).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.brand')).toBeFocused();
  await expect(button(page)).toBeHidden();
});

test('works from the keyboard', async ({ page }) => {
  await open(page, `#/${part.id}`);
  await scrollTo(page, 2);
  await expect(button(page)).toBeVisible();
  await button(page).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.brand')).toBeFocused();
});

test('is named in Russian and is not printed', async ({ page }) => {
  await seedSettings(page, { lang: 'ru' });
  await open(page, `#/${part.id}`);
  await scrollTo(page, 1.5);
  await expect(button(page)).toHaveAccessibleName('Наверх');
  await page.emulateMedia({ media: 'print' });
  await expect(button(page)).toBeHidden();
});

test('is quiet: at least 40 px, no horizontal overflow, axe clean in both themes', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await seedSettings(page, { theme });
    await open(page, `#/${part.id}`);
    await scrollTo(page, 1.5);
    await expect(button(page)).toBeVisible();
    // The flowing titles fade while the page scrolls; axe reads colours once they have settled.
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    const { width, height } = await boxOf(button(page)).then((b) => ({ width: b.right - b.left, height: b.bottom - b.top }));
    expect(Math.min(width, height)).toBeGreaterThanOrEqual(40);
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAxe(page);
  }
});

test('on a laptop it clears the ruler and the flowing titles', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, `#/${part.id}`);
  await scrollTo(page, 1.5);
  await expect(button(page)).toBeVisible();
  const box = await boxOf(button(page));
  expect(intersects(box, await boxOf(page.locator('.ruler')))).toBe(false);
  const titles = page.locator('.flow-toc-item');
  for (let i = 0; i < await titles.count(); i += 1) expect(intersects(box, await boxOf(titles.nth(i)))).toBe(false);
});

test.describe('on a phone with the install banner', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true });

  for (const lang of ['en', 'ru']) {
    test(`it rises above the banner in ${lang}`, async ({ page }) => {
      await seedSettings(page, { lang });
      await open(page, `#/${part.id}`);
      await page.evaluate(() => {
        const day = Date.now() - 24 * 3600 * 1000;
        window.localStorage.setItem('ivrit-studio:install', JSON.stringify({ visits: 1, firstSeen: day, lastSeen: day, dismissedAt: 0, installed: false }));
      });
      await page.reload();
      await page.locator('#app[data-ready="true"]').waitFor();
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt', { cancelable: true });
        event.prompt = () => Promise.resolve();
        event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
        window.dispatchEvent(event);
      });
      await expect(page.locator('#install')).toBeVisible();
      await scrollTo(page, 1.5);
      await expect(button(page)).toBeVisible();
      expect(intersects(await boxOf(button(page)), await boxOf(page.locator('#install')))).toBe(false);
    });
  }
});
