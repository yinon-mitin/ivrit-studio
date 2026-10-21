// Sections on their part pages, for every section in data/: title, groups under subheadings, entries in
// their views, Hebrew markup, cursive font, and links that scroll to the section or group.
import { test, expect } from '@playwright/test';
import { sectionRoutes, readParts, open, seedSettings } from './helpers.mjs';
import { displayHe } from '../../assets/js/core/hebrew.js';

const LETTER_VIEWS = ['letter-grid', 'letter-rows'];
/** The view element of a group: inside its group block, or straight in the section without groups. */
const viewOf = (page, route, group) => page.locator(
  group.id === null
    ? `#content [data-section="${route.section}"] > [data-view="${group.view}"]`
    : `#content [data-section="${route.section}"] [data-group="${group.id}"] [data-view="${group.view}"]`,
);

for (const route of sectionRoutes()) {
  test(`${route.hash} shows its title, its groups in order with their entries, and Hebrew as lang="he" dir="rtl"`, async ({ page }) => {
    await open(page, route.hash);

    const section = page.locator(`#content [data-screen="part"][data-part="${route.part}"] [data-section="${route.section}"]`);
    await expect(section.locator('.section-title')).toHaveText(route.title.en);
    await expect(section.locator('.section-title')).toBeInViewport();
    const titled = route.groups.filter((group) => group.id !== null);
    await expect(section.locator('.group-title')).toHaveText(titled.map((group) => group.title.en));
    for (const group of route.groups) {
      await expect(viewOf(page, route, group).locator('[data-entry]')).toHaveCount(group.items.length);
      for (const item of group.items) {
        const entry = viewOf(page, route, group).locator(`[data-entry="${item.id}"]`);
        await expect(entry).toContainText(item.he);
        if (group.view !== 'letter-rows') for (const related of item.related) await expect(entry).toContainText(related);
      }
    }

    const unmarked = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT);
      const found = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const el = node.parentElement;
        const marked = el.closest('[lang]')?.lang === 'he' && el.closest('[dir]')?.dir === 'rtl';
        if (/[֐-׿]/.test(node.data) && !marked) found.push(node.data);
      }
      return found;
    });
    expect(unmarked).toEqual([]);
  });

  test(`${route.hash} with nikud off ${route.nikudToggle ? 'shows plain or stripped Hebrew' : 'keeps its nikud'}`, async ({ page }) => {
    await seedSettings(page, { nikud: false });
    await open(page, route.hash);
    for (const item of route.items) {
      const expected = route.nikudToggle ? displayHe(item, false) : item.he;
      await expect(page.locator(`#content [data-entry="${item.id}"]`).first()).toContainText(expected);
    }
  });

  if (route.groups.some((group) => LETTER_VIEWS.includes(group.view) && group.items.length > 0)) {
    test(`${route.hash} draws cursive letters in Gveret Levin`, async ({ page }) => {
      await open(page, route.hash);
      const cursive = page.locator('#content .glyph-cursive').first();
      await expect(cursive).toHaveCSS('font-family', /^"?Gveret Levin"?,/);
      const text = await cursive.textContent();
      expect(await page.evaluate((t) => document.fonts.check('32px "Gveret Levin"', t), text)).toBe(true);
    });
  }

  for (const group of route.groups.filter((g) => g.view === 'letter-rows' && g.items.length > 0)) {
    test(`${route.hash} puts each cursive letter under its print letter, right to left (${group.id})`, async ({ page }) => {
      await open(page, route.hash);
      const columns = await viewOf(page, route, group).locator('[data-entry]').evaluateAll((entries) => entries.map((entry) => {
        const box = (selector) => entry.querySelector(selector).getBoundingClientRect();
        const print = box('.glyph-print');
        const cursive = box('.glyph-cursive');
        return {
          sameText: entry.querySelector('.glyph-print').textContent === entry.querySelector('.glyph-cursive').textContent,
          below: cursive.top >= print.bottom - 1,
          centred: Math.abs((print.left + print.right) / 2 - (cursive.left + cursive.right) / 2) <= 2,
          x: print.left,
          y: print.top,
        };
      }));
      for (const column of columns) expect(column).toMatchObject({ sameText: true, below: true, centred: true });
      const [first, second] = columns;
      expect(second.y === first.y && second.x < first.x).toBe(true);
    });
  }

  for (const group of route.groups.filter((g) => g.view === 'table' && g.items.length > 0)) {
    test(`${route.hash} groups consecutive entries with the same sound into one sound cell (${group.id ?? 'section'})`, async ({ page }) => {
      await open(page, route.hash);
      const sounds = group.items.filter((item, i) => i === 0 || group.items[i - 1].translit !== item.translit);
      await expect(viewOf(page, route, group).locator('.table-sound')).toHaveText(sounds.map((item) => item.translit));
    });
  }

  const last = route.groups.at(-1);
  if (last.id !== null) {
    test(`${route.hash}/<group> scrolls to the group; an unknown group scrolls to the section`, async ({ page }) => {
      await open(page, `${route.hash}/${last.id}`);
      await expect(page.locator(`#${route.section}-${last.id} .group-title`)).toBeInViewport();
      await open(page, `${route.hash}/no-such-group`);
      await expect(page.locator(`#${route.section} .section-title`)).toBeInViewport();
    });
  }
}

// Readability (SPEC Layout): letters large and several per row; tables use the page width.
const letterRoute = sectionRoutes().find((r) => r.groups.some((g) => g.view === 'letter-grid' && g.items.length >= 10));
const tableRoute = sectionRoutes().find((r) => r.groups.some((g) => g.view === 'table'));

test('the letter grid shows 9 letters per row on a phone, 8–10 on a laptop, print glyphs at least 40 px', async ({ page }) => {
  await open(page, letterRoute.hash);
  const grid = page.locator('#content [data-view="letter-grid"]').first();
  const cells = await grid.locator('[data-entry]').evaluateAll((entries) => entries.map((entry) => ({
    top: Math.round(entry.getBoundingClientRect().top),
    glyph: parseFloat(getComputedStyle(entry.querySelector('.glyph-print')).fontSize),
  })));
  const perRow = cells.filter((cell) => cell.top === cells[0].top).length;
  const phone = page.viewportSize().width < 600;
  expect(perRow).toBeGreaterThanOrEqual(phone ? 9 : 8);
  expect(perRow).toBeLessThanOrEqual(phone ? 9 : 10);
  for (const cell of cells) expect(cell.glyph).toBeGreaterThanOrEqual(40);
});

test('a table fills the content width up to 48rem, under a header row', async ({ page }) => {
  await open(page, tableRoute.hash);
  const table = page.locator(`#content [data-section="${tableRoute.section}"] .entry-table`).first();
  await expect(table.locator('thead th')).toHaveText(['Hebrew', 'Sound', 'Name']);
  const [tableWidth, contentWidth] = await table.evaluate((node) => {
    const content = document.getElementById('content');
    const style = getComputedStyle(content);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return [node.getBoundingClientRect().width, Math.min(48 * rem, content.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))];
  });
  expect(tableWidth).toBeGreaterThanOrEqual(contentWidth - 1);
});

// Dictionary entries (list view): readable on a phone; words with gender and number show their forms.
const listRoute = sectionRoutes().find((r) => r.groups.some((g) => g.view === 'list' && g.items.length >= 6));
// Words with all four forms (gender and number); masculine/feminine-only forms (numbers) are covered by
// list-features.spec.mjs.
const fourForms = (item) => ['ms', 'fs', 'mp', 'fp'].every((key) => item.forms?.[key]);
const formsRoute = sectionRoutes().find((r) => readParts().flatMap((p) => p.sections)
  .find((s) => s.id === r.section).items.some(fourForms));

test('dictionary entries: one per row on a phone, several columns on a laptop, Hebrew at least 22 px', async ({ page }) => {
  await open(page, listRoute.hash);
  const list = page.locator(`#content [data-section="${listRoute.section}"] [data-view="list"]`).first();
  const entries = await list.locator('[data-entry]').evaluateAll((nodes) => nodes.map((node) => ({
    top: Math.round(node.getBoundingClientRect().top),
    he: parseFloat(getComputedStyle(node.querySelector('.entry-he')).fontSize),
  })));
  const perRow = entries.filter((entry) => entry.top === entries[0].top).length;
  expect(perRow).toBe(page.viewportSize().width < 600 ? 1 : 3);
  for (const entry of entries) expect(entry.he).toBeGreaterThanOrEqual(22);
});

test('words with forms show a singular/plural × masculine/feminine table, without repeating them as related words', async ({ page }) => {
  const section = readParts().flatMap((p) => p.sections).find((s) => s.id === formsRoute.section);
  await open(page, formsRoute.hash);
  for (const item of section.items.filter(fourForms)) {
    const entry = page.locator(`#content [data-entry="${item.id}"]`);
    const cells = entry.locator('.entry-forms tbody td');
    await expect(cells).toHaveText([item.forms.ms, item.forms.mp, item.forms.fs, item.forms.fp]);
    await expect(entry.locator('.entry-forms thead th')).toHaveText(['Singular', 'Plural']);
    for (const form of Object.values(item.forms)) await expect(entry.locator('.entry-related-he', { hasText: form })).toHaveCount(0);
  }
});
