// Shared e2e helpers: route enumeration from data/, page readiness, and the CONSTRAINTS.md checks.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROOT = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));

export const FONTS_DIR = fileURLToPath(new URL('assets/fonts/', ROOT));
export const fontFiles = () => readdirSync(FONTS_DIR).filter((file) => file.endsWith('.woff2'));

/**
 * Every screen the site can show, computed from data/ so new sections and weeks are covered
 * without editing tests: home, progress, each section tab (or the section), each week tab, each Blitz.
 * @returns {string[]} hashes such as '#/countries/eu-1'
 */
export function routes() {
  const index = readJson('data/index.json');
  const weeks = index.weeks.map((date) => readJson(`data/weeks/${date}.json`));
  const list = ['#/', '#/progress'];
  for (const id of index.sections) {
    const section = readJson(`data/sections/${id}.json`);
    const tabs = (section.tabs ?? []).map((tab) => tab.id);
    for (const week of weeks) {
      if (week.items.some((item) => item.section === id && item.tab === undefined)) tabs.push(`week-${week.week}`);
    }
    if (tabs.length === 0) list.push(`#/${id}`);
    for (const tab of tabs) list.push(`#/${id}/${tab}`);
    if ((section.blitz ?? []).length > 0) list.push(`#/${id}/blitz`);
  }
  return list;
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
 * One screen: no vertical or horizontal overflow on the document or the content container.
 * @param {import('@playwright/test').Page} page
 */
export async function expectOneScreen(page) {
  const overflow = await page.evaluate(() => {
    const measure = (el) => ({
      x: el.scrollWidth - el.clientWidth,
      y: el.scrollHeight - el.clientHeight,
    });
    return { document: measure(document.documentElement), content: measure(document.getElementById('content')) };
  });
  expect(overflow).toEqual({ document: { x: 0, y: 0 }, content: { x: 0, y: 0 } });
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
