// App shell behaviour: the contents lists the parts and sections from data/index.json; old and unknown
// routes land somewhere sensible.
import { test, expect } from '@playwright/test';
import { open, readParts } from './helpers.mjs';

const parts = readParts();

test('the contents shows the app name and one link per section in index.json', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ivrit Studio');
  await expect(page.locator('#content a[data-section]')).toHaveCount(parts.flatMap((part) => part.sections).length);
});

test('an unknown route shows the contents', async ({ page }) => {
  await open(page, '#/no-such-section/x/y');
  await expect(page.locator('#content [data-screen="contents"]')).toBeVisible();
});

test('old section, Blitz and progress links open the section in its part, and the contents', async ({ page }) => {
  for (const hash of ['#/alphabet', '#/alphabet/blitz']) {
    await open(page, hash);
    await expect(page.locator('#content [data-screen="part"]')).toHaveAttribute('data-part', 'reading');
    await expect(page.locator('#alphabet .section-title')).toBeInViewport();
  }
  await open(page, '#/countries/asia');
  await expect(page.locator('#countries-asia .group-title')).toBeInViewport();
  await open(page, '#/progress');
  await expect(page.locator('#content [data-screen="contents"]')).toBeVisible();
});

test('the page is not indexed and allows only same-origin resources', async ({ page }) => {
  await open(page, '#/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /default-src 'self'/);
});
