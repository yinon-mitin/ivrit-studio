// Phone header (SPEC Layout): across phone widths the site name stays on one line (or is hidden, the
// cursive mark staying), the header and the page bar stay within 132 px, and nothing overflows sideways.
import { test, expect } from '@playwright/test';
import { open, readParts, seedSettings, expectNoHorizontalOverflow } from './helpers.mjs';

const WIDTHS = [360, 390, 412, 417, 430, 480, 512, 520, 640];
const part = readParts()[0];

for (const lang of ['en', 'ru']) {
  for (const width of WIDTHS) {
    test(`at ${width} px in ${lang} the name does not wrap and header + bar fit 132 px`, async ({ page }) => {
      await seedSettings(page, { lang });
      await page.setViewportSize({ width, height: 800 });
      await open(page, `#/${part.id}`);
      const measured = await page.evaluate(() => {
        const name = document.querySelector('.brand-name');
        const style = getComputedStyle(name);
        const box = name.getBoundingClientRect();
        return {
          visible: box.width > 1,
          lines: Math.round(box.height / parseFloat(style.lineHeight === 'normal' ? parseFloat(style.fontSize) * 1.2 : style.lineHeight)),
          chrome: document.querySelector('header').offsetHeight + document.getElementById('page-bar').offsetHeight,
        };
      });
      if (measured.visible) expect(measured.lines).toBe(1);
      expect(measured.chrome).toBeLessThanOrEqual(132);
      await expectNoHorizontalOverflow(page);
    });
  }
}
