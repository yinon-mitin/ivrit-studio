// Preload hints (SPEC Performance): the browser fetches each module exactly once, and never warns that
// a preload went unused (a `crossorigin` on a module preload makes both happen).
import { test, expect } from '@playwright/test';
import { open, recordRequests } from './helpers.mjs';

test('the first load requests each file once, and no preload goes unused', async ({ page }) => {
  const urls = recordRequests(page);
  const warnings = [];
  page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()); });
  await open(page, '#/');
  const twice = urls.filter((url, i) => urls.indexOf(url) !== i);
  expect(twice).toEqual([]);
  expect(urls.filter((url) => url.endsWith('.js')).length).toBeGreaterThanOrEqual(20);
  expect(warnings.filter((text) => /preload/i.test(text))).toEqual([]);
});
