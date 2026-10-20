import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, parseSettings, nextTheme } from '../../assets/js/core/settings.js';

describe('defaultSettings', () => {
  it('follows SPEC: system theme, nikud on, English, translations shown', () => {
    assert.deepEqual(defaultSettings(), { theme: 'system', nikud: true, lang: 'en', hide: false });
  });
});

describe('parseSettings', () => {
  it('keeps valid stored values', () => {
    const stored = JSON.stringify({ theme: 'dark', nikud: false, lang: 'ru', hide: true });
    assert.deepEqual(parseSettings(stored), { theme: 'dark', nikud: false, lang: 'ru', hide: true });
  });

  it('returns the defaults when nothing is stored', () => {
    assert.deepEqual(parseSettings(null), defaultSettings());
  });

  it('returns the defaults for broken JSON', () => {
    assert.deepEqual(parseSettings('{ theme: dark'), defaultSettings());
  });

  it('returns the defaults when the stored value is not an object', () => {
    for (const stored of ['null', '[]', '7', '"dark"']) assert.deepEqual(parseSettings(stored), defaultSettings(), stored);
  });

  it('replaces each invalid field with its default and keeps the valid ones', () => {
    const stored = JSON.stringify({ theme: 'sepia', nikud: false, lang: 'he', hide: 'yes', extra: 1 });
    assert.deepEqual(parseSettings(stored), { theme: 'system', nikud: false, lang: 'en', hide: false });
  });

  it('reads settings saved by the trainer version: known fields kept, old ones dropped', () => {
    const stored = JSON.stringify({ theme: 'light', nikud: false, uiLang: 'ru', showRu: true, blitzMode: 'cards' });
    assert.deepEqual(parseSettings(stored), { theme: 'light', nikud: false, lang: 'en', hide: false });
  });
});

describe('nextTheme', () => {
  it('cycles system → light → dark → system', () => {
    assert.equal(nextTheme('system'), 'light');
    assert.equal(nextTheme('light'), 'dark');
    assert.equal(nextTheme('dark'), 'system');
  });
});
