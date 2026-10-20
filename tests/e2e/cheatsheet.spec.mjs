// Section pages, for every section in data/: title, groups under subheadings, entries in their views,
// Hebrew markup, cursive font, and group links that scroll to the group.
import { test, expect } from '@playwright/test';
import { sectionRoutes, open, seedSettings } from './helpers.mjs';
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

    await expect(page.locator('#content [data-screen="section"] h2')).toHaveText(route.title.en);
    const titled = route.groups.filter((group) => group.id !== null);
    await expect(page.locator('#content .group-title')).toHaveText(titled.map((group) => group.title.en));
    await expect(page.locator('#content nav')).toHaveCount(0);
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
    test(`#/${route.section}/<group> scrolls to the group; an unknown group opens the section at the top`, async ({ page }) => {
      await open(page, `#/${route.section}/${last.id}`);
      await expect(page.locator(`#${route.section}-${last.id} .group-title`)).toBeInViewport();
      await open(page, `#/${route.section}/no-such-group`);
      await expect(page.locator('#content [data-screen="section"] h2')).toBeInViewport();
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
}
