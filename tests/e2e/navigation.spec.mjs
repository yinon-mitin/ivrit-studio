// Navigation: home is the entry point to every section (with its size), and every section screen
// leads back home.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open, sectionRoutes } from './helpers.mjs';

const index = JSON.parse(readFileSync(new URL('../../data/index.json', import.meta.url), 'utf8'));
const sections = index.sections.map((id) => JSON.parse(readFileSync(new URL(`../../data/sections/${id}.json`, import.meta.url), 'utf8')));
const countOf = (id) => {
  const routes = sectionRoutes().filter((r) => r.section === id && r.view !== 'letter-rows');
  return new Set(routes.flatMap((r) => r.items.map((i) => i.id))).size;
};

test('home shows each section with its icon, title and card count', async ({ page }) => {
  await open(page, '#/');
  for (const section of sections) {
    const tile = page.locator(`#content [data-tile="${section.id}"]`);
    await expect(tile.locator(`a[data-section="${section.id}"]`)).toHaveAttribute('href', `#/${section.id}`);
    await expect(tile).toContainText(section.title.en);
    await expect(tile).toContainText(`${countOf(section.id)} cards`);
    if (section.icon) await expect(tile.locator('[lang="he"]')).toHaveText(section.icon);
  }
});

test('every section screen links back home', async ({ page }) => {
  for (const section of sections) {
    await open(page, `#/${section.id}`);
    await expect(page.locator('#content a[data-action="home"]')).toHaveAttribute('href', '#/');
  }
  await page.locator('#content a[data-action="home"]').click();
  await expect(page.locator('#content [data-screen="home"]')).toBeVisible();
});
