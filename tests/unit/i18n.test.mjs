import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, localized, countEntries } from '../../assets/js/core/i18n.js';

describe('t', () => {
  it('returns the string in the requested language', () => {
    assert.equal(t('contents', 'en'), 'Contents');
    assert.equal(t('contents', 'ru'), 'Содержание');
  });

  it('fills {placeholders} from params', () => {
    assert.equal(t('loadError', 'en', { detail: 'HTTP 404' }), 'Could not load: HTTP 404');
  });

  it('returns the key itself for an unknown key, so a gap is visible', () => {
    assert.equal(t('no-such-key', 'ru'), 'no-such-key');
  });

  it('has every string in both languages', () => {
    for (const [key, text] of Object.entries(STRINGS)) {
      assert.ok(text.en?.trim() && text.ru?.trim(), key);
    }
  });
});

describe('localized', () => {
  it('picks the language from a data text', () => {
    assert.equal(localized({ en: 'Alphabet', ru: 'Алфавит' }, 'ru'), 'Алфавит');
  });

  it('falls back to English when the language is missing', () => {
    assert.equal(localized({ en: 'Alphabet' }, 'ru'), 'Alphabet');
  });
});

describe('countEntries', () => {
  it('uses the English singular and plural', () => {
    assert.equal(countEntries(1, 'en'), '1 entry');
    assert.equal(countEntries(31, 'en'), '31 entries');
  });

  it('uses the three Russian plural forms', () => {
    assert.equal(countEntries(1, 'ru'), '1 запись');
    assert.equal(countEntries(21, 'ru'), '21 запись');
    assert.equal(countEntries(3, 'ru'), '3 записи');
    assert.equal(countEntries(14, 'ru'), '14 записей');
    assert.equal(countEntries(73, 'ru'), '73 записи');
  });
});
