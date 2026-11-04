// list view (SPEC Layout): the reading and meaning of an entry start at the same left edge whether they sit
// beside the Hebrew or, when they do not fit, under it. A wrapped one used to shift towards the Hebrew.
import { test, expect } from '@playwright/test';
import { open, readParts } from './helpers.mjs';

const part = readParts().find((p) => p.id === 'grammar');
const section = part.sections.find((s) => s.id === 'prepositions');

test('in the examples of Prepositions, every meaning starts at the left edge of its entry', async ({ page }) => {
  await open(page, `#/${part.id}/${section.id}`);
  const offsets = await page.locator(`#${section.id} .entry`).evaluateAll((entries) => entries.map((entry) => {
    const gloss = entry.querySelector('.entry-gloss').getBoundingClientRect();
    const wrapped = gloss.top > entry.querySelector('.entry-he').getBoundingClientRect().top + 8;
    return { id: entry.dataset.entry, wrapped, offset: gloss.left - entry.getBoundingClientRect().left };
  }));
  expect(offsets.some((o) => o.wrapped), 'some meaning wraps under its Hebrew').toBe(true);
  for (const o of offsets) expect(o.offset, o.id).toBeLessThanOrEqual(1);
});
