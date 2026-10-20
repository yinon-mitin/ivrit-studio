import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, parseSettings, nextTheme } from '../../assets/js/core/settings.js';

describe('defaultSettings', () => {
  it('follows SPEC: system theme, nikud on, RU translation off, UI language from the browser', () => {
    assert.deepEqual(defaultSettings('ru-RU'), { theme: 'system', nikud: true, uiLang: 'ru', showRu: false });
    assert.equal(defaultSettings('en-GB').uiLang, 'en');
  });
});

describe('parseSettings', () => {
  it('keeps valid stored values', () => {
    const stored = JSON.stringify({ theme: 'dark', nikud: false, uiLang: 'en', showRu: true });
    assert.deepEqual(parseSettings(stored, 'ru'), { theme: 'dark', nikud: false, uiLang: 'en', showRu: true });
  });

  it('returns the defaults when nothing is stored', () => {
    assert.deepEqual(parseSettings(null, 'ru'), defaultSettings('ru'));
  });

  it('returns the defaults for broken JSON', () => {
    assert.deepEqual(parseSettings('{ theme: dark', 'en'), defaultSettings('en'));
  });

  it('returns the defaults when the stored value is not an object', () => {
    for (const stored of ['null', '[]', '7', '"dark"']) assert.deepEqual(parseSettings(stored, 'en'), defaultSettings('en'), stored);
  });

  it('replaces each invalid field with its default and keeps the valid ones', () => {
    const stored = JSON.stringify({ theme: 'sepia', nikud: 'yes', uiLang: 'he', showRu: true, blitzMode: 'quiz', extra: 1 });
    assert.deepEqual(parseSettings(stored, 'en'), { theme: 'system', nikud: true, uiLang: 'en', showRu: true });
  });
});

describe('nextTheme', () => {
  it('cycles system → light → dark → system', () => {
    assert.equal(nextTheme('system'), 'light');
    assert.equal(nextTheme('light'), 'dark');
    assert.equal(nextTheme('dark'), 'system');
  });
});
