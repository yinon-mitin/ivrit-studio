// Shared e2e helpers: route enumeration from data/, page readiness, and the CONSTRAINTS.md checks.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROOT = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));

export const FONTS_DIR = fileURLToPath(new URL('assets/fonts/', ROOT));
export const fontFiles = () => readdirSync(FONTS_DIR).filter((file) => file.endsWith('.woff2'));

const readSections = () => readJson('data/index.json').sections.map((id) => readJson(`data/sections/${id}.json`));

/**
 * Every Cheatsheet screen in data/: each section tab (or the section when it has no tabs), including
 * week tabs, with what it should show.
 * @returns {Array<{ hash: string, section: string, tab: string | null, view: string, tabs: string[], count: number,
 *   nikudToggle: boolean, items: Array<{ id: string, he: string, plain?: string, en: string, ru: string, related: string[] }> }>}
 */
export function sectionRoutes() {
  const weeks = readJson('data/index.json').weeks.map((date) => readJson(`data/weeks/${date}.json`));
  const list = [];
  for (const section of readSections()) {
    const items = [...section.items];
    const tabs = (section.tabs ?? []).map((tab) => ({ id: tab.id, view: tab.view ?? section.view }));
    for (const week of weeks) {
      const own = week.items.filter((item) => item.section === section.id);
      const weekTab = `week-${week.week}`;
      if (own.some((item) => item.tab === undefined)) tabs.push({ id: weekTab, view: section.view });
      items.push(...own.map((item) => ({ tab: weekTab, ...item })));
    }
    const tabIds = tabs.map((tab) => tab.id);
    const shown = (entries) => entries.map((item) => ({
      id: item.id, he: item.he, plain: item.plain, en: item.en, ru: item.ru, related: (item.related ?? []).map((r) => r.he),
    }));
    if (tabs.length === 0) {
      list.push({
        hash: `#/${section.id}`, section: section.id, tab: null, view: section.view, tabs: [], count: items.length,
        nikudToggle: section.nikudToggle !== false, items: shown(items),
      });
    }
    for (const tab of tabs) {
      const own = items.filter((item) => item.tab === tab.id);
      // A letter-rows tab without entries of its own shows the whole section (SPEC decision, T7).
      const entries = own.length === 0 && tab.view === 'letter-rows' ? items : own;
      list.push({
        hash: `#/${section.id}/${tab.id}`, section: section.id, tab: tab.id, view: tab.view, tabs: tabIds, count: entries.length,
        nikudToggle: section.nikudToggle !== false, items: shown(entries),
      });
    }
  }
  return list;
}

/**
 * Every screen the site can show, computed from data/ so new sections and weeks are covered
 * without editing tests: home, progress, each section tab (or the section), each week tab, each Blitz.
 * @returns {string[]} hashes such as '#/countries/eu-1'
 */
export function routes() {
  const blitz = readSections().filter((section) => (section.blitz ?? []).length > 0).map((section) => `#/${section.id}/blitz`);
  return ['#/', '#/progress', ...sectionRoutes().map((route) => route.hash), ...blitz];
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
 * One screen: no vertical or horizontal overflow on the document or the content container, and no
 * view cell marked `[data-fit]` whose content spills out of it (1 px tolerance for rounding).
 * @param {import('@playwright/test').Page} page
 */
export async function expectOneScreen(page) {
  const overflow = await page.evaluate(() => {
    const measure = (el) => ({
      x: el.scrollWidth - el.clientWidth,
      y: el.scrollHeight - el.clientHeight,
    });
    const spilling = [...document.querySelectorAll('#content [data-fit]')]
      .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent.trim());
    return { document: measure(document.documentElement), content: measure(document.getElementById('content')), spilling };
  });
  expect(overflow).toEqual({ document: { x: 0, y: 0 }, content: { x: 0, y: 0 }, spilling: [] });
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
