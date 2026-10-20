import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, pickLang, t, localized, countCards } from '../../assets/js/core/i18n.js';

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

describe('countCards', () => {
  it('uses English singular and plural', () => {
    assert.equal(countCards(1, 'en'), '1 card');
    assert.equal(countCards(31, 'en'), '31 cards');
  });

  it('uses the three Russian plural forms', () => {
    assert.equal(countCards(1, 'ru'), '1 карточка');
    assert.equal(countCards(21, 'ru'), '21 карточка');
    assert.equal(countCards(3, 'ru'), '3 карточки');
    assert.equal(countCards(14, 'ru'), '14 карточек');
    assert.equal(countCards(73, 'ru'), '73 карточки');
  });
});
