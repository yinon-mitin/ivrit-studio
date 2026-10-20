import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSection, validateAll } from '../../assets/js/core/schema.js';

// A valid baseline; each test changes one thing.
const entry = (slug, extra = {}) => ({
  id: `countries.${slug}`, he: 'צָרְפַת', translit: 'Tsarfat', en: 'France', ru: 'Франция', verified: false, ...extra,
});
const section = (extra = {}) => ({
  id: 'countries', title: { en: 'Countries', ru: 'Страны' }, view: 'list', items: [entry('france')], ...extra,
});
const entries = (count, extra = {}) => Array.from({ length: count }, (_, i) => entry(`c${i}`, extra));
const part = (extra = {}) => ({ id: 'words', title: { en: 'Words', ru: 'Слова' }, sections: ['countries'], ...extra });
const data = (extra = {}) => ({
  index: { parts: [part()] },
  sections: { countries: section() },
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

  it('accepts a #rgb or #rrggbb swatch and rejects anything else', () => {
    for (const swatch of ['#fff', '#d32f2f', '#A0B1C2']) {
      assert.deepEqual(validateSection(section({ items: [entry('france', { swatch })] })).errors, [], swatch);
    }
    for (const swatch of ['red', '#12', '#gggggg', '#1234', 'd32f2f', '']) {
      assert.ok(hasError(validateSection(section({ items: [entry('france', { swatch })] })), /countries\.france: swatch must be #rgb or #rrggbb/), swatch);
    }
  });

  it('rejects he without a Hebrew letter', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { he: 'Tsarfat' })] })), /he has no Hebrew letter/));
  });

  it('rejects a group that does not exist', () => {
    const report = validateSection(section({ groups: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }], items: [entry('x', { group: 'eu-9' })] }));
    assert.ok(hasError(report, /countries\.x: unknown group "eu-9"/));
  });

  it('rejects an entry with a group in a section without groups', () => {
    assert.ok(hasError(validateSection(section({ items: [entry('x', { group: 'eu-1' })] })), /unknown group "eu-1"/));
  });

  it('rejects an entry without a group when the section has groups', () => {
    const report = validateSection(section({ groups: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }], items: [entry('x')] }));
    assert.ok(hasError(report, /countries\.x: needs a group/));
  });

  it('rejects an unknown section view', () => {
    assert.ok(hasError(validateSection(section({ view: 'carousel' })), /unknown view "carousel"/));
  });

  it('rejects an unknown group view', () => {
    const report = validateSection(section({ groups: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' }, view: 'carousel' }], items: [] }));
    assert.ok(hasError(report, /group eu-1 has unknown view "carousel"/));
  });

  it('accepts any number of entries in a group or section', () => {
    const groups = [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }];
    assert.deepEqual(validateSection(section({ groups, items: entries(80, { group: 'eu-1' }) })).errors, []);
    assert.deepEqual(validateSection(section({ items: entries(80) })).errors, []);
  });

  it('accepts an empty letter-rows group', () => {
    const groups = [{ id: 'rows', title: { en: 'Rows', ru: 'Строки' }, view: 'letter-rows' }];
    assert.deepEqual(validateSection(section({ view: 'letter-grid', groups, items: [] })).errors, []);
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

describe('validateAll', () => {
  it('accepts valid data and passes section warnings through', () => {
    const report = validateAll(data());
    assert.deepEqual(report.errors, []);
    assert.equal(report.warnings.length, 1);
  });

  it('rejects an index without a parts array', () => {
    assert.ok(hasError(validateAll(data({ index: { sections: ['countries'] } })), /index\.json: needs a "parts" array/));
  });

  it('rejects a part section without a file', () => {
    const report = validateAll(data({ index: { parts: [part({ sections: ['countries', 'nikud'] })] } }));
    assert.ok(hasError(report, /part words: section "nikud" has no file/));
  });

  it('rejects a section file in no part', () => {
    const report = validateAll(data({ index: { parts: [part({ sections: [] })] } }));
    assert.ok(hasError(report, /sections\/countries\.json is not in any part/));
  });

  it('rejects a section in more than one part', () => {
    const report = validateAll(data({ index: { parts: [part(), part({ id: 'reading' })] } }));
    assert.ok(hasError(report, /section "countries" is in more than one part/));
  });

  it('rejects a duplicate part id', () => {
    const report = validateAll(data({ index: { parts: [part(), part({ sections: [] })] } }));
    assert.ok(hasError(report, /duplicate part "words"/));
  });

  it('rejects a part id that is not a slug, a title without en or ru, and sections that are not an array', () => {
    assert.ok(hasError(validateAll(data({ index: { parts: [part({ id: 'Words' })] } })), /part Words: id must be a lowercase slug/));
    assert.ok(hasError(validateAll(data({ index: { parts: [part({ title: { en: 'Words' } })] } })), /part words: title needs en and ru/));
    assert.ok(hasError(validateAll(data({ index: { parts: [part({ sections: 'countries' })] } })), /part words: sections must be an array/));
  });

  it('rejects a section whose id does not match its file name', () => {
    const report = validateAll(data({ sections: { countries: section({ id: 'lands' }) } }));
    assert.ok(hasError(report, /sections\/countries\.json: id is "lands"/));
  });
});
