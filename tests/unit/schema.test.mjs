import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSection, validateWeek, validateAll } from '../../assets/js/core/schema.js';

// A valid baseline; each test changes one thing.
const entry = (slug, extra = {}) => ({
  id: `countries.${slug}`, he: 'צָרְפַת', translit: 'Tsarfat', en: 'France', ru: 'Франция', verified: false, ...extra,
});
const section = (extra = {}) => ({
  id: 'countries', title: { en: 'Countries', ru: 'Страны' }, view: 'card-grid', items: [entry('france')], ...extra,
});
const entries = (count, extra = {}) => Array.from({ length: count }, (_, i) => entry(`c${i}`, extra));
const week = (extra = {}) => ({ week: '2026-10-11', letters: ['א', 'ב'], items: [], ...extra });
const data = (extra = {}) => ({
  index: { sections: ['countries'], weeks: ['2026-10-11'] },
  sections: { countries: section() },
  weeks: { '2026-10-11': week() },
  ...extra,
});
const hasError = (report, pattern) => report.errors.some((e) => pattern.test(e));

describe('validateSection', () => {
  it('accepts a valid section', () => {
    assert.deepEqual(validateSection(section()).errors, []);
  });

  it('warns with the count of unverified entries', () => {
    const report = validateSection(section({ items: [entry('a'), entry('b'), entry('c', { verified: true })] }));
    assert.deepEqual(report.errors, []);
    assert.equal(report.warnings.length, 1);
    assert.match(report.warnings[0], /2 entries with verified: false/);
  });

  it('has no warnings when every entry is verified', () => {
    assert.deepEqual(validateSection(section({ items: [entry('a', { verified: true })] })).warnings, []);
  });

  it('rejects a duplicate id', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('france'), entry('france')] })), /countries\.france: duplicate id/));
  });

  it('rejects an id from another section', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { id: 'alphabet.alef' })] })), /must be "countries\.<slug>"/));
  });

  it('rejects an id whose slug is not lowercase kebab-case', () => {
    for (const id of ['countries.France', 'countries.', 'countries.a.b', 'countries']) {
      assert.ok(hasError(validateSection(section({ items: [entry('x', { id })] })), /must be "countries\.<slug>"/), id);
    }
  });

  it('rejects a missing or empty required field', () => {
    for (const field of ['id', 'he', 'translit', 'en', 'ru']) {
      const missing = entry('x');
      delete missing[field];
      assert.ok(hasError(validateSection(section({ items: [missing] })), new RegExp(`missing ${field}`)), field);
      assert.ok(hasError(validateSection(section({ items: [entry('x', { [field]: ' ' })] })), new RegExp(`missing ${field}`)), field);
    }
  });

  it('rejects verified that is not a boolean', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { verified: 'no' })] })), /verified must be true or false/));
  });

  it('rejects an entry that is not an object', () => {
    assert.ok(hasError(validateSection(section({ items: [null] })), /entry must be an object/));
  });

  it('rejects he without a Hebrew letter', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { he: 'Tsarfat' })] })), /he has no Hebrew letter/));
  });

  it('rejects a tab that does not exist', () => {
    const report = validateSection(section({ tabs: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }], items: [entry('x', { tab: 'eu-9' })] }));
    assert.ok(hasError(report, /countries\.x: unknown tab "eu-9"/));
  });

  it('rejects an entry with a tab in a section without tabs', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { tab: 'eu-1' })] })), /unknown tab "eu-1"/));
  });

  it('rejects an entry without a tab when the section has tabs', () => {
    const report = validateSection(section({ tabs: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }], items: [entry('x')] }));
    assert.ok(hasError(report, /countries\.x: needs a tab/));
  });

  it('rejects an unknown section view', () => {
    assert.ok(hasError(validateSection(section({ view: 'carousel' })), /unknown view "carousel"/));
  });

  it('rejects an unknown tab view', () => {
    const report = validateSection(section({ tabs: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' }, view: 'list' }], items: [] }));
    assert.ok(hasError(report, /tab eu-1 has unknown view "list"/));
  });

  it('allows 14 entries per card-grid tab and rejects 15', () => {
    const tabs = [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }];
    assert.deepEqual(validateSection(section({ tabs, items: entries(14, { tab: 'eu-1' }) })).errors, []);
    assert.ok(hasError(validateSection(section({ tabs, items: entries(15, { tab: 'eu-1' }) })), /tab eu-1 has 15 entries, limit 14/));
  });

  it('allows 24 entries per letter-grid tab and rejects 25', () => {
    const tabs = [{ id: 'letters', title: { en: 'Letters', ru: 'Буквы' } }];
    const letters = section({ view: 'letter-grid', tabs });
    assert.deepEqual(validateSection({ ...letters, items: entries(24, { tab: 'letters' }) }).errors, []);
    assert.ok(hasError(validateSection({ ...letters, items: entries(25, { tab: 'letters' }) }), /limit 24/));
  });

  it('uses the tab view over the section view for the limit', () => {
    const tabs = [{ id: 'rows', title: { en: 'Rows', ru: 'Строки' }, view: 'card-grid' }];
    const report = validateSection(section({ view: 'letter-grid', tabs, items: entries(15, { tab: 'rows' }) }));
    assert.ok(hasError(report, /tab rows has 15 entries, limit 14/));
  });

  it('applies the limit to a section without tabs', () => {
    assert.ok(hasError(validateSection(section({ items: entries(15) })), /items has 15 entries, limit 14/));
  });

  it('accepts an empty letter-rows tab', () => {
    const tabs = [{ id: 'rows', title: { en: 'Rows', ru: 'Строки' }, view: 'letter-rows' }];
    assert.deepEqual(validateSection(section({ view: 'letter-grid', tabs, items: [] })).errors, []);
  });

  it('rejects a section id that is not a slug', () => {
    assert.ok(hasError(validateSection(section({ id: 'Countries' })), /section Countries: id must be a lowercase slug/));
  });

  it('rejects a title without en or ru', () => {
    assert.ok(hasError(validateSection(section({ title: { en: 'Countries' } })), /title needs en and ru/));
  });

  it('rejects items that are not an array', () => {
    assert.ok(hasError(validateSection(section({ items: {} })), /items must be an array/));
  });

  it('accepts an optional icon and rejects an empty or non-string one', () => {
    assert.deepEqual(validateSection(section({ icon: 'אֶרֶץ' })).errors, []);
    assert.ok(hasError(validateSection(section({ icon: ' ' })), /section countries: icon must be a non-empty string/));
    assert.ok(hasError(validateSection(section({ icon: 7 })), /icon must be a non-empty string/));
  });
});

describe('validateWeek', () => {
  it('accepts a valid week', () => {
    assert.deepEqual(validateWeek(week({ items: [{ section: 'countries' }] }), ['countries']).errors, []);
  });

  it('rejects a week date that is not YYYY-MM-DD', () => {
    assert.ok(hasError(validateWeek(week({ week: '11.10.2026' }), []), /week 11\.10\.2026: week must be YYYY-MM-DD/));
  });

  it('rejects letters that are not Hebrew letters', () => {
    assert.ok(hasError(validateWeek(week({ letters: ['א', 'b'] }), []), /letters must be Hebrew letters/));
    assert.ok(hasError(validateWeek(week({ letters: 'אב' }), []), /letters must be Hebrew letters/));
  });

  it('rejects an item whose section does not exist', () => {
    const report = validateWeek(week({ items: [{ id: 'colors.red', section: 'colors' }] }), ['countries']);
    assert.ok(hasError(report, /colors\.red: unknown section "colors"/));
  });

  it('rejects items that are not an array', () => {
    assert.ok(hasError(validateWeek(week({ items: null }), []), /items must be an array/));
  });
});

describe('validateAll', () => {
  it('accepts valid data and passes section warnings through', () => {
    const report = validateAll(data());
    assert.deepEqual(report.errors, []);
    assert.equal(report.warnings.length, 1);
  });

  it('rejects an index without sections and weeks arrays', () => {
    assert.ok(hasError(validateAll(data({ index: {} })), /index\.json: needs "sections" and "weeks" arrays/));
  });

  it('rejects an index section without a file', () => {
    const report = validateAll(data({ index: { sections: ['countries', 'nikud'], weeks: ['2026-10-11'] } }));
    assert.ok(hasError(report, /index\.json: section "nikud" has no file/));
  });

  it('rejects a section file missing from the index', () => {
    const report = validateAll(data({ index: { sections: [], weeks: ['2026-10-11'] } }));
    assert.ok(hasError(report, /sections\/countries\.json is not listed in index\.json/));
  });

  it('rejects an index week without a file', () => {
    const report = validateAll(data({ index: { sections: ['countries'], weeks: ['2026-10-11', '2026-10-18'] } }));
    assert.ok(hasError(report, /index\.json: week "2026-10-18" has no file/));
  });

  it('rejects a week file missing from the index', () => {
    const report = validateAll(data({ index: { sections: ['countries'], weeks: [] } }));
    assert.ok(hasError(report, /weeks\/2026-10-11\.json is not listed in index\.json/));
  });

  it('rejects a section whose id does not match its file name', () => {
    const report = validateAll(data({ sections: { countries: section({ id: 'lands' }) } }));
    assert.ok(hasError(report, /sections\/countries\.json: id is "lands"/));
  });

  it('rejects a week whose date does not match its file name', () => {
    const report = validateAll(data({ weeks: { '2026-10-11': week({ week: '2026-10-12' }) } }));
    assert.ok(hasError(report, /weeks\/2026-10-11\.json: week is "2026-10-12"/));
  });

  it('rejects a week item whose section does not exist', () => {
    const weeks = { '2026-10-11': week({ items: [{ ...entry('x', { id: 'colors.red' }), section: 'colors' }] }) };
    assert.ok(hasError(validateAll(data({ weeks })), /colors\.red: unknown section "colors"/));
  });

  it('validates week items as entries of their section', () => {
    const weeks = { '2026-10-11': week({ items: [{ ...entry('spain', { he: 'Spain' }), section: 'countries' }] }) };
    assert.ok(hasError(validateAll(data({ weeks })), /countries\.spain: he has no Hebrew letter/));
  });

  it('rejects a week item that duplicates a section id', () => {
    const weeks = { '2026-10-11': week({ items: [{ ...entry('france'), section: 'countries' }] }) };
    assert.ok(hasError(validateAll(data({ weeks })), /countries\.france: duplicate id/));
  });

  it('puts week items without a tab into the week tab', () => {
    const vocab = { id: 'vocab', title: { en: 'Vocabulary', ru: 'Слова' }, view: 'card-grid', items: [] };
    const items = entries(3).map((e, i) => ({ ...e, id: `vocab.w${i}`, section: 'vocab' }));
    const report = validateAll({
      index: { sections: ['vocab'], weeks: ['2026-10-11'] }, sections: { vocab }, weeks: { '2026-10-11': week({ items }) },
    });
    assert.deepEqual(report.errors, []);
  });

  it('applies the tab limit to the week tab', () => {
    const vocab = { id: 'vocab', title: { en: 'Vocabulary', ru: 'Слова' }, view: 'card-grid', items: [] };
    const items = entries(15).map((e, i) => ({ ...e, id: `vocab.w${i}`, section: 'vocab' }));
    const report = validateAll({
      index: { sections: ['vocab'], weeks: ['2026-10-11'] }, sections: { vocab }, weeks: { '2026-10-11': week({ items }) },
    });
    assert.ok(hasError(report, /tab week-2026-10-11 has 15 entries, limit 14/));
  });

  it('keeps an explicit tab on a week item', () => {
    const tabs = [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }];
    const weeks = { '2026-10-11': week({ items: [{ ...entry('spain', { tab: 'eu-1' }), section: 'countries' }] }) };
    const report = validateAll(data({ sections: { countries: section({ tabs, items: [entry('france', { tab: 'eu-1' })] }) }, weeks }));
    assert.deepEqual(report.errors, []);
  });
});
