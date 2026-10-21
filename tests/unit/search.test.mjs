import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, searchKey, matchesEntry, searchParts } from '../../assets/js/core/search.js';

const france = {
  id: 'countries.france', he: 'צָרְפַת', translit: 'Tsarfat', en: 'France', ru: 'Франция', group: 'eu-1',
  related: [{ he: 'צָרְפָתִית', translit: 'Tsarfatit', en: 'French', ru: 'французский' }],
};
const now = { id: 'vocab.akhshav', he: 'עַכְשָׁו', plain: 'עכשיו', translit: 'Akhshav', en: 'now', ru: 'сейчас' };
const shalom = { id: 'greetings.shalom', he: 'שָׁלוֹם', translit: 'Shalom', en: 'hello', ru: 'привет' };
const jeans = { id: 'geresh.jeans', he: 'ג׳ִינְס', translit: 'Jins', en: 'jeans', ru: 'джинсы' };

const countries = {
  id: 'countries', view: 'list',
  groups: [{ id: 'eu-1', title: { en: 'EU I', ru: 'ЕС I' } }, { id: 'asia', title: { en: 'Asia', ru: 'Азия' } }],
  items: [france, { id: 'countries.china', he: 'סִין', translit: 'Sin', en: 'China', ru: 'Китай', group: 'asia' }],
};
const vocab = { id: 'vocab', view: 'list', items: [now, shalom] };
const alphabet = {
  id: 'alphabet', view: 'letter-grid',
  groups: [{ id: 'letters', title: { en: 'Letters', ru: 'Буквы' } }, { id: 'rows', title: { en: 'Rows', ru: 'Строки' }, view: 'letter-rows' }],
  items: [{ id: 'alphabet.shin', he: 'שׁ', translit: 'sh', en: 'Shin', ru: 'Шин', group: 'letters' }],
};
const parts = [
  { id: 'reading', title: { en: 'Reading', ru: 'Чтение' }, sections: [alphabet] },
  { id: 'words', title: { en: 'Words', ru: 'Слова' }, sections: [vocab, countries] },
];

describe('normalize', () => {
  it('lowercases, removes nikud and geresh/apostrophes, and trims and collapses spaces', () => {
    assert.equal(normalize('  Shalom  '), 'shalom');
    assert.equal(normalize('שָׁלוֹם'), 'שלום');
    assert.equal(normalize('ג׳ִינְס'), 'גינס');
    assert.equal(normalize("ג'ינס"), 'גינס');
    assert.equal(normalize('Me’eifo  ata?'), 'meeifo ata?');
  });
});

describe('searchKey', () => {
  it('is the normalized text without sentence punctuation', () => {
    assert.equal(searchKey('Hey!'), 'hey');
    assert.equal(searchKey('Me’eifo  ata?'), 'meeifo ata');
    assert.equal(searchKey('both … and'), 'both and');
    assert.equal(searchKey('Ma, nishma?!'), 'ma nishma');
    assert.equal(searchKey('!?'), '');
  });
});

describe('matchesEntry', () => {
  it('finds Hebrew with or without nikud', () => {
    assert.equal(matchesEntry(shalom, normalize('שלום')), true);
    assert.equal(matchesEntry(shalom, normalize('שָׁלוֹם')), true);
  });

  it('finds the plain spelling and related words', () => {
    assert.equal(matchesEntry(now, normalize('עכשיו')), true);
    assert.equal(matchesEntry(france, normalize('צרפתית')), true);
  });

  it('finds the transliteration and both translations, case-insensitively, as a substring', () => {
    assert.equal(matchesEntry(france, normalize('tsar')), true);
    assert.equal(matchesEntry(france, normalize('FRA')), true);
    assert.equal(matchesEntry(france, normalize('франц')), true);
  });

  it('finds Hebrew written with an apostrophe for the geresh', () => {
    assert.equal(matchesEntry(jeans, normalize("ג'ינס")), true);
  });

  it('ignores sentence punctuation in the query and in the entry', () => {
    const hello = { id: 'greetings.shalom', he: 'שָׁלוֹם', translit: 'Shalom', en: 'hello, hi, hey, bye', ru: 'привет, пока' };
    const howIsIt = { id: 'greetings.ma-nishma', he: 'מַה נִּשְׁמָע?', translit: 'Ma nishma?', en: "How's it going?", ru: 'Как дела?' };
    assert.equal(matchesEntry(hello, searchKey('Hey!')), true);
    assert.equal(matchesEntry(hello, searchKey('Привет!')), true);
    assert.equal(matchesEntry(howIsIt, searchKey('Ma nishma?')), true);
    assert.equal(matchesEntry(howIsIt, searchKey('Ma nishma')), true);
    assert.equal(matchesEntry(howIsIt, searchKey('дела?')), true);
  });

  it('does not match what is not there', () => {
    assert.equal(matchesEntry(france, normalize('spain')), false);
  });
});

describe('searchParts', () => {
  it('is empty for an empty or blank query', () => {
    assert.deepEqual(searchParts(parts, ''), []);
    assert.deepEqual(searchParts(parts, '   '), []);
  });

  it('returns the matching entries by part and section, in data order, without empty parts or sections', () => {
    const results = searchParts(parts, 'sh');
    assert.deepEqual(results.map((r) => [r.part.id, r.sections.map((s) => [s.id, s.items.map((i) => i.id)])]), [
      ['reading', [['alphabet', ['alphabet.shin']]]],
      ['words', [['vocab', ['vocab.akhshav', 'greetings.shalom']]]],
    ]);
  });

  it('finds an entry for a query with punctuation', () => {
    const [words] = searchParts(parts, 'Привет!');
    assert.deepEqual(words.sections[0].items.map((i) => i.id), ['greetings.shalom']);
  });

  it('keeps only the groups with matches, and drops letter-rows groups, which would repeat the letters', () => {
    const [words] = searchParts(parts, 'france');
    assert.deepEqual(words.sections[0].groups.map((g) => g.id), ['eu-1']);
    const [reading] = searchParts(parts, 'shin');
    assert.deepEqual(reading.sections[0].groups.map((g) => g.id), ['letters']);
  });

  it('keeps a section without groups as it is, with only its matches', () => {
    const [words] = searchParts(parts, 'now');
    assert.equal(words.sections[0].groups, undefined);
    assert.deepEqual(words.sections[0].items.map((i) => i.id), ['vocab.akhshav']);
  });

  it('does not change its inputs', () => {
    const before = JSON.stringify(parts);
    searchParts(parts, 'a');
    assert.equal(JSON.stringify(parts), before);
  });
});
