import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, pickLang, t, localized, weekTitle } from '../../assets/js/core/i18n.js';

describe('pickLang', () => {
  it('picks Russian for any ru locale', () => {
    for (const language of ['ru', 'ru-RU', 'RU-ua']) assert.equal(pickLang(language), 'ru', language);
  });

  it('picks English for every other or missing locale', () => {
    for (const language of ['en-US', 'he-IL', 'rus', '', undefined]) assert.equal(pickLang(language), 'en', String(language));
  });
});

describe('t', () => {
  it('returns the string in the requested language', () => {
    assert.equal(t('sections', 'en'), 'Sections');
    assert.equal(t('sections', 'ru'), 'Разделы');
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

describe('weekTitle', () => {
  it('names a week tab by its date in the interface language', () => {
    assert.equal(weekTitle('2026-10-11', 'en'), 'Week of 11 Oct');
    assert.equal(weekTitle('2026-10-11', 'ru'), 'Неделя 11 окт.');
  });

  it('does not shift the day across time zones', () => {
    assert.equal(weekTitle('2026-01-01', 'en'), 'Week of 1 Jan');
  });
});
