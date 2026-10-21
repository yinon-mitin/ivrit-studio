// Installable as an app (SPEC Install): the browser accepts the manifest, finds no installability
// error, and the page does not fetch a favicon on load. Chromium only (CDP): playwright.config.mjs
// leaves this file out of the webkit project.
import { test, expect } from '@playwright/test';
import { open, recordRequests } from './helpers.mjs';

test.describe('installability', () => {
  test('the manifest parses without errors and the browser reports nothing blocking the install', async ({ page }) => {
    await open(page, '#/');
    const cdp = await page.context().newCDPSession(page);
    const { url, errors, data } = await cdp.send('Page.getAppManifest');
    expect(url).toMatch(/\/manifest\.webmanifest$/);
    expect(errors.filter((error) => error.critical)).toEqual([]);
    expect(JSON.parse(data).name).toBe('Ivrit Studio');
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
  });

  test('the first load does not ask for a favicon or an icon (the browser fetches the manifest itself)', async ({ page }) => {
    const urls = recordRequests(page);
    await open(page, '#/');
    expect(urls.filter((url) => /favicon|\/assets\/icons\//.test(url))).toEqual([]);
  });
});
