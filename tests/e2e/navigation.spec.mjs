// Navigation: the contents is the entry point to every part and section (with its icon and size), and
// a section link opens its part scrolled to it.
import { test, expect } from '@playwright/test';
import { open, readParts } from './helpers.mjs';

const parts = readParts();

test('the contents shows each part with a link to its page, and its sections with icon, title and entry count', async ({ page }) => {
  await open(page, '#/');
  for (const part of parts) {
    const entry = page.locator(`#content [data-part="${part.id}"]`);
    await expect(entry.locator('h3 a')).toHaveText(part.title.en);
    await expect(entry.locator('h3 a')).toHaveAttribute('href', `#/${part.id}`);
    for (const section of part.sections) {
      const link = entry.locator(`a[data-section="${section.id}"]`);
      await expect(link).toHaveAttribute('href', `#/${part.id}/${section.id}`);
      await expect(link).toContainText(section.title.en);
      await expect(link).toContainText(`${section.items.length} ${section.items.length === 1 ? 'entry' : 'entries'}`);
      if (section.icon) await expect(link.locator('[lang="he"]')).toHaveText(section.icon);
    }
  }
});

test('a section link opens its part page scrolled to the section', async ({ page }) => {
  const part = parts.find((p) => p.sections.length > 1);
  const section = part.sections.at(-1);
  await open(page, '#/');
  await page.locator(`#content a[data-section="${section.id}"]`).click();
  await expect(page.locator('#content [data-screen="part"]')).toHaveAttribute('data-part', part.id);
  await expect(page.locator(`#${section.id} .section-title`)).toBeInViewport();
});
