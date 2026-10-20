// Shared e2e helpers: route enumeration from data/, page readiness, and the CONSTRAINTS.md checks.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROOT = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));

export const FONTS_DIR = fileURLToPath(new URL('assets/fonts/', ROOT));
export const fontFiles = () => readdirSync(FONTS_DIR).filter((file) => file.endsWith('.woff2'));

/** Every part in index.json order, with its sections loaded. */
export const readParts = () => readJson('data/index.json').parts
  .map((part) => ({ ...part, sections: part.sections.map((id) => readJson(`data/sections/${id}.json`)) }));

/**
 * Every section in data/, in contents order, with its place on its part page and what it should show: its groups in order (one untitled group for a
 * section without groups), each with its view and entries, and every entry of the section.
 * @returns {Array<{ hash: string, part: string, section: string, title: { en: string, ru: string }, nikudToggle: boolean,
 *   groups: Array<{ id: string | null, title?: { en: string, ru: string }, view: string, items: Array<object> }>,
 *   items: Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string, related: string[] }> }>}
 */
export function sectionRoutes() {
  const shown = (entries) => entries.map((item) => ({
    id: item.id, he: item.he, plain: item.plain, translit: item.translit, en: item.en, ru: item.ru,
    related: (item.related ?? []).map((r) => r.he),
  }));
  return readParts().flatMap((part) => part.sections.map((section) => {
    const declared = section.groups ?? [];
    const groups = declared.length === 0
      ? [{ id: null, view: section.view, items: shown(section.items) }]
      : declared.map((group) => {
        const view = group.view ?? section.view;
        const own = section.items.filter((item) => item.group === group.id);
        // A letter-rows group without entries of its own shows the whole section (SPEC Section).
        return { id: group.id, title: group.title, view, items: shown(own.length === 0 && view === 'letter-rows' ? section.items : own) };
      });
    return {
      hash: `#/${part.id}/${section.id}`, part: part.id, section: section.id, title: section.title,
      nikudToggle: section.nikudToggle !== false, groups, items: shown(section.items),
    };
  }));
}

/**
 * Every screen the site can show, computed from data/ so new parts and sections are covered without
 * editing tests: the contents and each part page.
 * @returns {string[]} hashes such as '#/words'
 */
export function routes() {
  return ['#/', ...readParts().map((part) => `#/${part.id}`)];
}

/**
 * Opens a route and waits until the app has rendered it and fonts have loaded.
 * @param {import('@playwright/test').Page} page
 * @param {string} hash
 */
export async function open(page, hash) {
  await page.goto(`/${hash}`);
  await page.locator('#app[data-ready="true"]').waitFor({ timeout: 5000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * No horizontal overflow (CONSTRAINTS): the document does not scroll sideways, and no scroll container
 * inside the content hides a sideways overflow (1 px tolerance for rounding). Vertical scroll is fine.
 * @param {import('@playwright/test').Page} page
 */
export async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const inner = [...document.querySelectorAll('#content *')]
      // Visually hidden text (1 px, clipped) is meant to overflow its box.
      .filter((el) => el.clientWidth > 1 && ['auto', 'scroll', 'hidden'].includes(getComputedStyle(el).overflowX))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.className || el.tagName);
    return { document: root.scrollWidth - root.clientWidth, inner };
  });
  expect(overflow).toEqual({ document: 0, inner: [] });
}

/**
 * Zero critical or serious axe violations for WCAG 2.0 A/AA and 2.1 AA.
 * @param {import('@playwright/test').Page} page
 */
export async function expectNoSeriousAxe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(serious).toEqual([]);
}

/**
 * Records every request URL the page makes, for the external-request check.
 * @param {import('@playwright/test').Page} page
 * @returns {string[]}
 */
export function recordRequests(page) {
  const urls = [];
  page.on('request', (request) => urls.push(request.url()));
  return urls;
}

/**
 * The recorded URLs that leave the site's origin (data: and blob: stay local).
 * @param {string[]} urls
 * @param {string} baseURL
 */
export const externalRequests = (urls, baseURL) => urls.filter((url) => {
  const { protocol, origin } = new URL(url);
  return protocol !== 'data:' && protocol !== 'blob:' && origin !== new URL(baseURL).origin;
});

export const SETTINGS_KEY = 'ivrit-studio:settings';

/**
 * Seeds settings before every load of the page (merged over the defaults by the app).
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, unknown>} settings
 */
export async function seedSettings(page, settings) {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [SETTINGS_KEY, JSON.stringify(settings)]);
}

/**
 * Opens the ⚙ settings menu if it is closed.
 * @param {import('@playwright/test').Page} page
 */
export async function openMenu(page) {
  const menu = page.locator('[data-setting="menu"]');
  if (!(await menu.evaluate((details) => details.open))) await menu.locator('summary').click();
}
