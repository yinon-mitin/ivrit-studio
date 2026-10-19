// Anki export: every section screen offers a TSV download of the whole section (weeks included).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { open, sectionRoutes } from './helpers.mjs';

const sections = [...new Set(sectionRoutes().map((route) => route.section))];
const entriesOf = (id) => new Set(sectionRoutes().filter((r) => r.section === id).flatMap((r) => r.items.map((i) => i.id))).size;

for (const id of sections) {
  test(`#/${id} downloads ivrit-${id}.tsv with the Anki headers and one row per entry`, async ({ page }) => {
    await open(page, `#/${id}`);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#content [data-action="anki"]').click()]);
    expect(download.suggestedFilename()).toBe(`ivrit-${id}.tsv`);
    const lines = readFileSync(await download.path(), 'utf8').trimEnd().split('\n');
    expect(lines.slice(0, 3)).toEqual(['#separator:tab', '#html:false', '#tags column:3']);
    expect(lines.length - 3).toBe(entriesOf(id));
    for (const row of lines.slice(3)) expect(row.split('\t')).toHaveLength(3);
  });
}
