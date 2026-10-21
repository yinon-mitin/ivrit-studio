// Flowing section titles (SPEC Layout): on wide screens, a part page with several sections shows their
// titles beside the ruler — passed ones at the top, the current one large, coming ones at the bottom —
// and they flow as the page scrolls. Each title is a link to its section.
import { test, expect } from '@playwright/test';
import { open, readParts, expectNoSeriousAxe } from './helpers.mjs';

const part = readParts().find((p) => p.sections.length >= 3);
const items = (page) => page.locator('#flow-toc .flow-toc-item');
const states = (page) => items(page).evaluateAll((nodes) => nodes.map((n) => n.dataset.state));

test.describe('at 1440 px', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('marks passed, current and coming sections while scrolling, and lays them out top to bottom', async ({ page }) => {
    await open(page, `#/${part.id}`);
    await expect(items(page)).toHaveText(part.sections.map((s) => s.title.en));
    await expect.poll(() => states(page)).toEqual(part.sections.map((_, i) => (i === 0 ? 'current' : 'upcoming')));
    const middle = 1;
    await page.locator(`#${part.sections[middle].id}`).evaluate((node) => node.scrollIntoView());
    await expect.poll(() => states(page)).toEqual(part.sections.map((_, i) => (i < middle ? 'past' : i === middle ? 'current' : 'upcoming')));
    await expect(items(page).nth(middle)).toHaveAttribute('aria-current', 'location');
    // No two titles overlap; past above current above coming. Measured once they have finished flowing.
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    const boxes = await items(page).evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect()).map((r) => [r.top, r.bottom]));
    for (let i = 1; i < boxes.length; i += 1) expect(boxes[i][0]).toBeGreaterThanOrEqual(boxes[i - 1][1] - 0.5);
  });

  test('a title is a link that scrolls to its section', async ({ page }) => {
    await open(page, `#/${part.id}`);
    const last = part.sections.at(-1);
    await items(page).last().click();
    await expect(page.locator(`#${last.id} .section-title`)).toBeInViewport();
    await expect.poll(() => states(page)).toContain('current');
    await expect(items(page).last()).toHaveAttribute('data-state', 'current');
  });

  test('the content keeps clear of the titles; axe clean in both themes', async ({ page }) => {
    await open(page, `#/${part.id}`);
    const [contentRight, titlesLeft] = await page.evaluate(() => {
      const content = document.getElementById('content');
      const right = content.getBoundingClientRect().right - parseFloat(getComputedStyle(content).paddingRight);
      const left = Math.min(...[...document.querySelectorAll('.flow-toc-item')].map((n) => n.getBoundingClientRect().left));
      return [right, left];
    });
    expect(contentRight).toBeLessThanOrEqual(titlesLeft);
    // Measure contrast once the titles have finished flowing.
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await expectNoSeriousAxe(page);
    }
  });
});

test('hidden below 72rem, on the contents and in print', async ({ page, isMobile }) => {
  await open(page, `#/${part.id}`);
  if (page.viewportSize().width < 1152) await expect(page.locator('#flow-toc')).toBeHidden();
  await open(page, '#/');
  await expect(page.locator('#flow-toc')).toBeHidden();
  // A phone never grows to 1440 px (its layout width stays the device's); widen desktop projects only.
  if (isMobile) return;
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, `#/${part.id}`);
  await expect(page.locator('#flow-toc')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#flow-toc')).toBeHidden();
});
