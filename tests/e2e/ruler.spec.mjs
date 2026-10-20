// Scroll ruler (SPEC Layout): on a laptop, a long part page gets a real-scale ruler at the right edge
// under the page bar — the page's scrollbar (role="scrollbar") marked in CSS millimetres that moves
// with the page, a marker reading the reading line in mm, and a mark per section. Drag, click and keys
// scroll the page; the browser's own scrollbar is hidden while it is shown. Phones do without it.
import { test, expect } from '@playwright/test';
import { open, readParts, expectNoSeriousAxe } from './helpers.mjs';

const PX_PER_MM = 96 / 25.4;
const MARKER = 16;
const part = readParts().find((p) => p.sections.length > 1 && p.sections.some((s) => (s.groups ?? []).length > 1));
const ruler = (page) => page.locator('#ruler');
const scrollY = (page) => page.evaluate(() => window.scrollY);
const percent = (page) => page.evaluate(() => {
  const root = document.documentElement;
  return (window.scrollY / (root.scrollHeight - window.innerHeight)) * 100;
});
const reading = async (page) => Number((await ruler(page).locator('.ruler-value').textContent()).replace(' mm', ''));

// The ruler is a laptop feature: on phone projects these tests have nothing to check and return early;
// the last test checks that phones do not show it.
const phone = (page) => page.viewportSize().width < 1024;

test.describe('on a laptop', () => {
  test('is a labelled vertical scrollbar under the page bar, starting at 0', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    await expect(ruler(page)).toBeVisible();
    await expect(ruler(page)).toHaveAttribute('role', 'scrollbar');
    await expect(ruler(page)).toHaveAttribute('aria-controls', 'content');
    await expect(ruler(page)).toHaveAttribute('aria-orientation', 'vertical');
    await expect(ruler(page)).toHaveAccessibleName('Page position');
    await expect(ruler(page)).toHaveAttribute('aria-valuenow', '0');
    await expect(ruler(page)).toHaveAttribute('aria-valuetext', /^\d+ mm — /);
    const [rulerTop, barBottom, zeroTop] = await page.evaluate(() => [
      document.getElementById('ruler').getBoundingClientRect().top,
      document.getElementById('page-bar').getBoundingClientRect().bottom,
      document.querySelector('.ruler-number').getBoundingClientRect().top,
    ]);
    expect(rulerTop).toBeGreaterThanOrEqual(barBottom - 0.5);
    await expect(ruler(page).locator('.ruler-number').first()).toHaveText('0');
    expect(zeroTop).toBeGreaterThanOrEqual(rulerTop);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(ruler(page)).toHaveAttribute('aria-valuenow', '100');
  });

  test('is marked in millimetres and moves 1:1 with the page; the marker reads the reading line in mm', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    const tops = await ruler(page).locator('.ruler-number').evaluateAll((nodes) => nodes.slice(0, 3).map((n) => n.getBoundingClientRect().top));
    expect(Math.abs((tops[1] - tops[0]) - 10 * PX_PER_MM)).toBeLessThanOrEqual(0.5);
    expect(await reading(page)).toBe(Math.round(MARKER / PX_PER_MM));
    const before = await ruler(page).locator('.ruler-number').nth(1).evaluate((n) => n.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollBy(0, 378));
    await expect.poll(() => reading(page)).toBe(Math.round((378 + MARKER) / PX_PER_MM));
    const after = await ruler(page).locator('.ruler-number').nth(1).evaluate((n) => n.getBoundingClientRect().top);
    expect(Math.abs((before - after) - 378)).toBeLessThanOrEqual(1);
  });

  test('a click brings that point to the reading line; dragging moves the page with the tape', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    const box = await ruler(page).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + 200);
    await expect.poll(() => scrollY(page)).toBeGreaterThan(200 - MARKER - 3);
    expect(await scrollY(page)).toBeLessThan(200 - MARKER + 3);

    const start = await scrollY(page);
    await page.mouse.move(box.x + box.width / 2, box.y + 400);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 350, { steps: 5 });
    await page.mouse.move(box.x + box.width / 2, box.y + 300, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => scrollY(page)).toBeGreaterThan(start + 97);
    expect(await scrollY(page)).toBeLessThan(start + 103);
  });

  test('keys: arrows move 10 mm, Page Down a screen, Home and End to the ends', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    await ruler(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => scrollY(page)).toBeGreaterThan(10 * PX_PER_MM - 1);
    expect(await scrollY(page)).toBeLessThan(10 * PX_PER_MM + 1);
    const before = await scrollY(page);
    await page.keyboard.press('PageDown');
    await expect.poll(() => scrollY(page)).toBeGreaterThan(before + 300);
    await page.keyboard.press('End');
    await expect.poll(() => percent(page)).toBeGreaterThan(99.5);
    await page.keyboard.press('Home');
    await expect.poll(() => scrollY(page)).toBe(0);
  });

  test('marks each section on the tape and names the current section', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    const marks = ruler(page).locator('.ruler-mark');
    await expect(marks).toHaveCount(part.sections.length);
    const last = part.sections.at(-1);
    await page.locator(`#${last.id}`).evaluate((node) => node.scrollIntoView());
    await expect(ruler(page)).toHaveAttribute('aria-valuetext', new RegExp(`— ${last.title.en.replace(/[&]/g, '\\$&')}$`));
    await expect(marks.last()).toHaveAttribute('data-current', '');
  });

  test('hides the browser scrollbar while shown, does not cover the content, and passes axe', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).toBe('none');
    const [contentRight, rulerLeft] = await page.evaluate(() => {
      const content = document.getElementById('content');
      const style = getComputedStyle(content);
      return [content.getBoundingClientRect().right - parseFloat(style.paddingRight), document.getElementById('ruler').getBoundingClientRect().left];
    });
    expect(contentRight).toBeLessThanOrEqual(rulerLeft);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectNoSeriousAxe(page);
    }
    await open(page, '#/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).toBe('auto');
  });
});

test('is hidden on phones, on the contents and in print', async ({ page }) => {
  await open(page, '#/');
  await expect(ruler(page)).toBeHidden();
  await open(page, `#/${part.id}`);
  if (phone(page)) await expect(ruler(page)).toBeHidden();
  else await expect(ruler(page)).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(ruler(page)).toBeHidden();
});
