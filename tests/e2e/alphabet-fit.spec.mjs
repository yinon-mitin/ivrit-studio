// Alphabet on a phone (SPEC Layout): opened from the contents, the letters and the finals both fit on
// one screen under the sticky header and bar, so the table needs no scrolling.
import { test, expect } from '@playwright/test';
import { open, sectionRoutes, seedSettings, expectNoHorizontalOverflow } from './helpers.mjs';

const route = sectionRoutes().find((r) => r.groups.filter((g) => g.view === 'letter-grid').length >= 2);

const PHONES = [{ width: 360, height: 640 }, { width: 390, height: 664 }];

for (const lang of ['en', 'ru']) {
  for (const viewport of PHONES) {
    test(`all letter grids of ${route.section} fit on a ${viewport.width}×${viewport.height} screen in ${lang}`, async ({ page }) => {
      await seedSettings(page, { lang });
      await page.setViewportSize(viewport);
      await open(page, route.hash);
      const { bottom, height } = await page.evaluate(() => {
        const grids = [...document.querySelectorAll('#content [data-view="letter-grid"]')];
        return { bottom: grids.at(-1).getBoundingClientRect().bottom, height: window.innerHeight };
      });
      expect(bottom).toBeLessThanOrEqual(height);
      await expectNoHorizontalOverflow(page);
    });
  }
}
