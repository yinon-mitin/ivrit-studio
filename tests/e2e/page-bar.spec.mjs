// Page bar (SPEC Layout): sticky under the header on part pages, it names the section and group being
// read, opens a jump list of the part's sections and groups, keeps the hide-translations toggle at
// hand, and shows how far down the page is.
import { test, expect } from '@playwright/test';
import { open, readParts, expectNoSeriousAxe, expectNoHorizontalOverflow } from './helpers.mjs';

// A part with several sections, one of them with titled groups (Vocabulary: words, countries).
const part = readParts().find((p) => p.sections.length > 1 && p.sections.some((s) => (s.groups ?? []).length > 1));
const grouped = part.sections.find((s) => (s.groups ?? []).length > 1);
const group = grouped.groups[2];
const bar = (page) => page.locator('#page-bar');
const ready = (page) => page.locator('#app[data-ready="true"]').waitFor();

test('names the section and group being read while scrolling', async ({ page }) => {
  await open(page, `#/${part.id}`);
  await expect(bar(page).locator('.page-current-section')).toHaveText(part.sections[0].title.en);
  await page.locator(`#${grouped.id}-${group.id}`).evaluate((node) => node.scrollIntoView());
  await expect(bar(page).locator('.page-current-section')).toHaveText(grouped.title.en);
  await expect(bar(page).locator('.page-current-group')).toHaveText(group.title.en);
});

test('the jump list opens the part\'s sections and groups, scrolls to one and closes; Escape closes it', async ({ page }) => {
  await open(page, `#/${part.id}`);
  const summary = bar(page).locator('summary');
  await summary.click();
  const links = bar(page).locator('.page-jump-section');
  await expect(links).toHaveText(part.sections.map((s) => s.title.en));
  await expect(bar(page).locator(`.page-jump-group[href="#/${part.id}/${grouped.id}/${group.id}"]`)).toHaveText(group.title.en);
  await bar(page).locator(`.page-jump-group[href="#/${part.id}/${grouped.id}/${group.id}"]`).click();
  await expect(page.locator(`#${grouped.id}-${group.id} .group-title`)).toBeInViewport();
  await expect(bar(page).locator('details')).not.toHaveAttribute('open', '');

  await bar(page).locator('summary').click();
  await expect(bar(page).locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(bar(page).locator('details')).not.toHaveAttribute('open', '');
  await expect(bar(page).locator('summary')).toBeFocused();
});

test('the hide toggle stays visible and works at the bottom of a long page', async ({ page }) => {
  await open(page, `#/${part.id}`);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const toggle = page.locator('[data-setting="hide"]');
  await expect(toggle).toBeInViewport();
  await toggle.click();
  await ready(page);
  await expect(page.locator('[data-setting="hide"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#content .reveal').first()).toBeVisible();
});

test('the progress line follows the scroll position', async ({ page }) => {
  await open(page, `#/${part.id}`);
  const progress = () => bar(page).evaluate((node) => Number(node.style.getPropertyValue('--progress')));
  expect(await progress()).toBe(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(progress).toBeGreaterThan(0.99);
});

test('header and bar stay within budget; no overflow; axe clean with the list open in both themes', async ({ page }) => {
  await open(page, `#/${part.id}`);
  const height = await page.evaluate(() => document.querySelector('header').offsetHeight + document.getElementById('page-bar').offsetHeight);
  expect(height).toBeLessThanOrEqual(page.viewportSize().width < 1024 ? 132 : 104);
  await bar(page).locator('summary').click();
  await expectNoHorizontalOverflow(page);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoSeriousAxe(page);
  }
});

test('there is no page bar on the contents', async ({ page }) => {
  await open(page, '#/');
  await expect(bar(page).locator('*')).toHaveCount(0);
});

test('opening a section link shows its whole title below the header and the bar', async ({ page }) => {
  const section = part.sections.at(-1);
  await open(page, `#/${part.id}/${section.id}`);
  const [titleTop, barBottom] = await page.evaluate((id) => [
    document.querySelector(`#${id} .section-title`).getBoundingClientRect().top,
    document.getElementById('page-bar').getBoundingClientRect().bottom,
  ], section.id);
  expect(titleTop).toBeGreaterThanOrEqual(barBottom);
});
