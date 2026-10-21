// The phrases view, on a fixture section served in place of data/ so it does not depend on real content:
// every card has the same shape (meaning first, then one row per form with its reading under the Hebrew),
// a masculine/feminine pair shares one card with tagged rows, hidden translations, nikud off and search.
import { test, expect } from '@playwright/test';
import { open, seedSettings, expectNoSeriousAxe, expectNoHorizontalOverflow } from './helpers.mjs';

const entry = (slug, extra) => ({ id: `fixture.${slug}`, verified: false, group: 'say', ...extra });
const SECTION = {
  id: 'fixture', title: { en: 'Fixture', ru: 'Проба' }, view: 'phrases',
  groups: [{ id: 'say', title: { en: 'Say', ru: 'Сказать' } }],
  items: [
    entry('name', {
      he: 'שְׁמִי דָּנָה', translit: 'Shmi Dana', en: 'My name is Dana.', ru: 'Меня зовут Дана.',
      note: { en: 'A little formal.', ru: 'Немного официально.' },
    }),
    entry('live', {
      he: 'אֲנִי גָּר בְּתֵל אָבִיב', translit: 'Ani gar be-Tel Aviv', en: 'I live in Tel Aviv.', ru: 'Я живу в Тель-Авиве.',
      variants: [
        { gender: 'm', he: 'אֲנִי גָּר בְּתֵל אָבִיב', translit: 'Ani gar be-Tel Aviv' },
        { gender: 'f', he: 'אֲנִי גָּרָה בְּתֵל אָבִיב', translit: 'Ani gara be-Tel Aviv' },
      ],
    }),
    entry('how-long', {
      he: 'כַּמָּה זְמַן אַתָּה בְּיִשְׂרָאֵל', translit: 'Kama zman ata be-Israel', en: 'How long have you been in Israel?', ru: 'Как давно ты в Израиле?',
      variants: [
        { gender: 'm', he: 'כַּמָּה זְמַן אַתָּה בְּיִשְׂרָאֵל', translit: 'Kama zman ata be-Israel' },
        { gender: 'f', he: 'כַּמָּה זְמַן אַתְּ בְּיִשְׂרָאֵל', translit: 'Kama zman at be-Israel' },
      ],
    }),
    entry('open', {
      he: 'פָּתוּחַ', plain: 'פתוח', translit: 'Patuakh', en: 'open', ru: 'открыто',
      forms: { ms: 'פָּתוּחַ', fs: 'פְּתוּחָה', mp: 'פְּתוּחִים', fp: 'פְּתוּחוֹת' },
    }),
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/data/index.json', (route) => route.fulfill({
    json: { parts: [{ id: 'test', title: { en: 'Test', ru: 'Тест' }, sections: ['fixture'] }] },
  }));
  await page.route('**/data/sections/fixture.json', (route) => route.fulfill({ json: SECTION }));
});

const card = (page, slug) => page.locator(`[data-entry="fixture.${slug}"]`);
const box = async (locator) => (await locator.boundingBox());

test('a masculine/feminine pair is one card: the meaning once, then a tagged row per form', async ({ page }) => {
  await open(page, '#/test');
  await expect(page.locator('[data-view="phrases"] [data-entry]')).toHaveCount(4);
  const live = card(page, 'live');
  await expect(live.locator('.phrase-meaning')).toHaveText('I live in Tel Aviv.');
  await expect(live.locator('.phrase-tag')).toHaveText(['m.', 'f.']);
  await expect(live.locator('.phrase-tag').first()).toHaveAttribute('title', 'Masc.');
  await expect(live.locator('.phrase-he')).toHaveText(['אֲנִי גָּר בְּתֵל אָבִיב', 'אֲנִי גָּרָה בְּתֵל אָבִיב']);
  await expect(live.locator('.phrase-translit')).toHaveText(['Ani gar be-Tel Aviv', 'Ani gara be-Tel Aviv']);
  await expect(card(page, 'name').locator('.phrase-tag')).toHaveCount(0);
});

test('every card has one shape: the meaning above the Hebrew, the reading right under it, Hebrew at the right edge', async ({ page }) => {
  await open(page, '#/test');
  for (const slug of ['name', 'live', 'how-long', 'open']) {
    const cardBox = await box(card(page, slug));
    for (const [i, row] of (await card(page, slug).locator('.phrase-row').all()).entries()) {
      const he = await box(row.locator('.phrase-he'));
      const reading = await box(row.locator('.phrase-translit'));
      expect(reading.y, `${slug} row ${i}: reading under its Hebrew`).toBeGreaterThanOrEqual(he.y + he.height - 1);
      expect(cardBox.x + cardBox.width - (he.x + he.width), `${slug} row ${i}: Hebrew at the right edge`).toBeLessThanOrEqual(1);
      expect(reading.x + reading.width, `${slug} row ${i}: reading under the Hebrew, at its right edge`)
        .toBeCloseTo(he.x + he.width, 0);
      if (i === 0) expect((await box(card(page, slug).locator('.phrase-meaning'))).y).toBeLessThan(he.y);
    }
  }
});

test('the two rows of a pair stay together in reading order: masculine, then feminine, directly under each other', async ({ page }) => {
  await open(page, '#/test');
  const rows = await card(page, 'how-long').locator('.phrase-row').all();
  const [m, f] = [await box(rows[0]), await box(rows[1])];
  expect(f.y).toBeGreaterThanOrEqual(m.y + m.height - 1);
  expect(f.y - (m.y + m.height)).toBeLessThanOrEqual(8);
});

test('words with forms and a note keep them inside the card', async ({ page }) => {
  await open(page, '#/test');
  await expect(card(page, 'open').locator('.entry-forms tbody td')).toHaveText(['פָּתוּחַ', 'פְּתוּחִים', 'פְּתוּחָה', 'פְּתוּחוֹת']);
  await expect(card(page, 'name').locator('.entry-note')).toHaveText('A little formal.');
});

test('with nikud off a row shows the plain spelling where there is one', async ({ page }) => {
  await seedSettings(page, { nikud: false });
  await open(page, '#/test');
  await expect(card(page, 'live').locator('.phrase-he')).toHaveText(['אני גר בתל אביב', 'אני גרה בתל אביב']);
  await expect(card(page, 'open').locator('.phrase-he')).toHaveText('פתוח');
});

test('Hide puts the meaning behind one button and blurs the readings and the note until it is pressed', async ({ page }) => {
  await seedSettings(page, { hide: true });
  await open(page, '#/test');
  const live = card(page, 'live');
  const blurred = (locator) => locator.evaluate((node) => getComputedStyle(node).filter.includes('blur'));
  await expect(live.locator('.reveal')).toHaveCount(1);
  await expect(live.locator('.reveal')).toHaveAccessibleName('Show translation');
  expect(await blurred(live.locator('.phrase-translit').first())).toBe(true);
  expect(await blurred(card(page, 'name').locator('.entry-note'))).toBe(true);
  await expect(live.locator('.phrase-he').first()).toBeVisible();
  expect(await blurred(live.locator('.phrase-he').first())).toBe(false);

  await live.locator('.reveal').click();
  await expect(live.locator('.reveal')).toHaveAttribute('aria-expanded', 'true');
  expect(await blurred(live.locator('.phrase-translit').first())).toBe(false);
  expect(await blurred(card(page, 'name').locator('.phrase-translit'))).toBe(true);
});

test('search finds a card by the feminine form and shows it as a card', async ({ page }) => {
  await open(page, '#/test');
  const input = page.locator('#search-input');
  if (!(await input.isVisible())) await page.locator('[data-action="search"]').click();
  await input.fill('ani gara');
  const result = page.locator('#content [data-screen="search"] [data-entry="fixture.live"]');
  await expect(result).toBeVisible();
  await expect(result.locator('.phrase-tag')).toHaveText(['m.', 'f.']);
  await expect(page.locator('#content [data-screen="search"] [data-entry]')).toHaveCount(1);
});

test('no horizontal overflow and axe clean in both themes, and in Russian', async ({ page }) => {
  await seedSettings(page, { lang: 'ru' });
  await open(page, '#/test');
  await expect(card(page, 'live').locator('.phrase-tag')).toHaveText(['м.', 'ж.']);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAxe(page);
  }
});
