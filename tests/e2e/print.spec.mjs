// Print (SPEC Print): each part prints on A4 without the header or buttons, without sideways
// clipping, black on white even in the dark theme, with hidden translations shown.
import { test, expect } from '@playwright/test';
import { open, readParts, SETTINGS_KEY } from './helpers.mjs';

// A4 width at 96 dpi minus the 12 mm side margins.
const A4_CONTENT = { width: Math.floor(((210 - 24) / 25.4) * 96), height: 1000 };

for (const part of readParts()) {
  test(`#/${part.id} prints on A4: no header or controls, nothing clipped sideways, black on white`, async ({ page, browserName }) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, JSON.stringify({ theme: 'dark', hide: true })), SETTINGS_KEY);
    await page.setViewportSize(A4_CONTENT);
    await open(page, `#/${part.id}`);
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('header')).toBeHidden();
    // The only buttons left are the (now open) hidden translations.
    for (const control of await page.locator('button:visible, input:visible').all()) {
      expect(await control.evaluate((node) => node.classList.contains('reveal'))).toBe(true);
    }
    const look = await page.evaluate(() => {
      const root = document.documentElement;
      const reveal = document.querySelector('.reveal');
      return {
        overflow: root.scrollWidth - root.clientWidth,
        background: getComputedStyle(document.body).backgroundColor,
        color: getComputedStyle(document.body).color,
        revealFilter: reveal ? getComputedStyle(reveal).filter : 'none',
      };
    });
    expect(look).toEqual({ overflow: 0, background: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', revealFilter: 'none' });
    // Only Chromium renders PDFs.
    if (browserName === 'chromium') {
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      expect(pdf.length).toBeGreaterThan(1000);
    }
  });
}
