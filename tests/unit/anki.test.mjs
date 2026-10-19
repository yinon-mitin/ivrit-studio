import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toTsv, ankiFileName } from '../../assets/js/core/anki.js';

const entry = (id, extra = {}) => ({ id, he: 'צָרְפַת', translit: 'Tzarfat', en: 'France', ru: 'Франция', ...extra });

describe('toTsv', () => {
  it('starts with the Anki headers for tab separation, plain text and a tags column', () => {
    const lines = toTsv({ id: 'countries', items: [] }).split('\n');
    assert.deepEqual(lines.slice(0, 3), ['#separator:tab', '#html:false', '#tags column:3']);
  });

  it('writes one row per entry: Hebrew, "translit — en / ru", tags for the section and the tab', () => {
    const tsv = toTsv({ id: 'countries', items: [entry('countries.france', { tab: 'eu-1' })] });
    assert.equal(tsv.split('\n')[3], 'צָרְפַת\tTzarfat — France / Франция\tivrit::countries ivrit::eu-1');
  });

  it('tags week entries with their week tab and entries without a tab with the section only', () => {
    const tsv = toTsv({ id: 'vocab', items: [entry('vocab.a', { tab: 'week-2026-10-11' }), entry('vocab.b')] });
    const tags = tsv.trimEnd().split('\n').slice(3).map((line) => line.split('\t')[2]);
    assert.deepEqual(tags, ['ivrit::vocab ivrit::week-2026-10-11', 'ivrit::vocab']);
  });

  it('replaces tabs and line breaks inside fields with spaces, so every row has three columns', () => {
    const tsv = toTsv({ id: 'x', items: [entry('x.y', { he: 'אָ\tב', en: 'one\ntwo', ru: 'три\r\nчетыре' })] });
    const row = tsv.split('\n')[3];
    assert.equal(row.split('\t').length, 3);
    assert.equal(row, 'אָ ב\tTzarfat — one two / три четыре\tivrit::x');
  });

  it('ends with a newline and has one line per entry after the headers', () => {
    const tsv = toTsv({ id: 'x', items: [entry('x.a'), entry('x.b')] });
    assert.ok(tsv.endsWith('\n'));
    assert.equal(tsv.trimEnd().split('\n').length, 5);
  });
});

describe('ankiFileName', () => {
  it('is ivrit-<section>.tsv', () => {
    assert.equal(ankiFileName({ id: 'countries' }), 'ivrit-countries.tsv');
  });
});
