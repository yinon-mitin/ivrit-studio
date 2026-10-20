// Hide translations (SPEC): readings and meanings in list and table views become blurred buttons that
// show their value on click, Enter or Space; letter names stay; the setting is remembered.
import { test, expect } from '@playwright/test';
import { open, readParts, sectionRoutes, expectNoSeriousAxe } from './helpers.mjs';

const listRoute = sectionRoutes().find((r) => r.groups.some((g) => g.view === 'list'));
const tableRoute = sectionRoutes().find((r) => r.groups.some((g) => g.view === 'table'));
const letterPart = readParts().find((p) => p.sections.some((s) => s.view === 'letter-grid'));
const ready = (page) => page.locator('#app[data-ready="true"]').waitFor();
const toggle = (page) => page.locator('[data-setting="hide"]');
const blurred = (locator) => locator.evaluate((node) => getComputedStyle(node).filter.includes('blur'));

test('Hide blurs every reading and meaning behind a "Show translation" button; one press shows one', async ({ page }) => {
  await open(page, `#/${listRoute.part}`);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#content .reveal')).toHaveCount(0);
  await toggle(page).click();
  await ready(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');

  const group = listRoute.groups.find((g) => g.view === 'list');
  const item = group.items[0];
  const reveals = page.locator(`#content [data-section="${listRoute.section}"] [data-view="list"] .reveal`);
  await expect(reveals).toHaveCount(group.items.length);
  const first = page.locator(`#content [data-entry="${item.id}"] .reveal`);
  await expect(first).toHaveAccessibleName('Show translation');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  expect(await blurred(first)).toBe(true);

  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  expect(await blurred(first)).toBe(false);
  await expect(first).toContainText(item.en);
  await expect(reveals.nth(1)).toHaveAttribute('aria-expanded', 'false');

  await reveals.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(reveals.nth(1)).toHaveAttribute('aria-expanded', 'true');
});

test('table sounds and names are hidden too; letter names are not', async ({ page }) => {
  await open(page, `#/${tableRoute.part}`);
  await toggle(page).click();
  await ready(page);
  const table = page.locator(`#content [data-section="${tableRoute.section}"] .entry-table`).first();
  await expect(table.locator('.table-name .reveal').first()).toHaveAttribute('aria-expanded', 'false');
  await expect(table.locator('.table-sound .reveal').first()).toHaveAttribute('aria-expanded', 'false');
  await open(page, `#/${letterPart.id}`);
  await expect(page.locator('#content [data-view="letter-grid"] .reveal')).toHaveCount(0);
});

test('Hide is remembered, and turning it off shows everything', async ({ page }) => {
  await open(page, `#/${listRoute.part}`);
  await toggle(page).click();
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#content .reveal').first()).toBeVisible();
  await toggle(page).click();
  await ready(page);
  await expect(page.locator('#content .reveal')).toHaveCount(0);
  const item = listRoute.groups.find((g) => g.view === 'list').items[0];
  await expect(page.locator(`#content [data-entry="${item.id}"]`)).toContainText(item.en);
});

test('passes axe with Hide on, in both themes', async ({ page }) => {
  await open(page, `#/${listRoute.part}`);
  await toggle(page).click();
  await ready(page);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoSeriousAxe(page);
  }
});
