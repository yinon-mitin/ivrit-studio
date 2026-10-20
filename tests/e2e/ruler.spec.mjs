// Scroll ruler (SPEC Layout): on a laptop, a long part page gets a fixed ruler at the right edge — the
// page's scrollbar (role="scrollbar") with the position in %, a mark per section and the current
// section's title; click, drag and keys scroll the page. Phones do without it.
import { test, expect } from '@playwright/test';
import { open, readParts, expectNoSeriousAxe } from './helpers.mjs';

const part = readParts().find((p) => p.sections.length > 1 && p.sections.some((s) => (s.groups ?? []).length > 1));
const ruler = (page) => page.locator('#ruler');
const percent = (page) => page.evaluate(() => {
  const root = document.documentElement;
  return (window.scrollY / (root.scrollHeight - window.innerHeight)) * 100;
});

// The ruler is a laptop feature: on phone projects these tests have nothing to check and return early;
// the last test checks that phones do not show it.
const phone = (page) => page.viewportSize().width < 1024;

test.describe('on a laptop', () => {
  test('is a labelled vertical scrollbar whose value follows the scroll position', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    await expect(ruler(page)).toBeVisible();
    await expect(ruler(page)).toHaveAttribute('role', 'scrollbar');
    await expect(ruler(page)).toHaveAttribute('aria-controls', 'content');
    await expect(ruler(page)).toHaveAttribute('aria-orientation', 'vertical');
    await expect(ruler(page)).toHaveAccessibleName('Page position');
    await expect(ruler(page)).toHaveAttribute('aria-valuenow', '0');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(ruler(page)).toHaveAttribute('aria-valuenow', '100');
  });

  test('a click at half its height scrolls to the middle; keys move 5%, 25% and to the ends', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    const box = await ruler(page).locator('.ruler-scale').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => percent(page)).toBeGreaterThan(47);
    expect(await percent(page)).toBeLessThan(53);

    await ruler(page).focus();
    await page.keyboard.press('Home');
    await expect.poll(() => percent(page)).toBeLessThan(0.5);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => percent(page)).toBeGreaterThan(4);
    expect(await percent(page)).toBeLessThan(6);
    await page.keyboard.press('PageDown');
    await expect.poll(() => percent(page)).toBeGreaterThan(29);
    await page.keyboard.press('End');
    await expect.poll(() => percent(page)).toBeGreaterThan(99.5);
  });

  test('marks each section where it is reached, and names the current section', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
    const marks = ruler(page).locator('.ruler-mark');
    await expect(marks).toHaveCount(part.sections.length);
    const last = part.sections.at(-1);
    await page.locator(`#${last.id}`).evaluate((node) => node.scrollIntoView());
    await expect(ruler(page).locator('.ruler-title')).toHaveText(last.title.en);
    const markPercent = Number(await marks.last().getAttribute('data-percent'));
    expect(Math.abs(markPercent - (await percent(page)))).toBeLessThanOrEqual(1);
    await expect(marks.last()).toHaveAttribute('data-current', '');
  });

  test('does not cover the content, and passes axe in both themes', async ({ page }) => {
    if (phone(page)) return;
    await open(page, `#/${part.id}`);
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
