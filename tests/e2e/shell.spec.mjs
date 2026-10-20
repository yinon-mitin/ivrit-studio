// App shell behaviour: home lists the sections from data/index.json; unknown routes fall back to home.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

const index = JSON.parse(readFileSync(new URL('../../data/index.json', import.meta.url), 'utf8'));

test('home shows the app name and one link per section in index.json', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ivrit Studio');
  await expect(page.locator('#content a[data-section]')).toHaveCount(index.sections.length);
});

test('an unknown route shows home', async ({ page }) => {
  await open(page, '#/no-such-section/x');
  await expect(page.locator('#content [data-screen="home"]')).toBeVisible();
});

test('old Blitz and progress links open the section and home', async ({ page }) => {
  await open(page, '#/alphabet/blitz');
  await expect(page.locator('#content [data-screen="section"] h2')).toHaveText('Alphabet');
  await open(page, '#/progress');
  await expect(page.locator('#content [data-screen="home"]')).toBeVisible();
});

test('the page is not indexed and allows only same-origin resources', async ({ page }) => {
  await open(page, '#/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /default-src 'self'/);
});
