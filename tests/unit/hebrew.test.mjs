import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripNikud, isHebrew, displayHe } from '../../assets/js/core/hebrew.js';

describe('stripNikud', () => {
  it('removes vowel points and the shin dot', () => {
    assert.equal(stripNikud('שָׁלוֹם'), 'שלום');
  });

  it('removes dagesh', () => {
    assert.equal(stripNikud('בּ'), 'ב');
  });

  it('removes the sin dot, rafe, meteg and qamats qatan', () => {
    assert.equal(stripNikud('שׂ'), 'ש');
    assert.equal(stripNikud('בֿ'), 'ב');
    assert.equal(stripNikud('בָֽ'), 'ב');
    assert.equal(stripNikud('כׇ'), 'כ');
  });

  it('removes the upper and lower dots', () => {
    assert.equal(stripNikud('אׄבׅ'), 'אב');
  });

  it('removes cantillation marks', () => {
    assert.equal(stripNikud('בְּרֵאשִׁ֖ית'), 'בראשית');
  });

  it('keeps the apostrophe used as geresh', () => {
    assert.equal(stripNikud("צ'ילה"), "צ'ילה");
  });

  it('keeps geresh and gershayim', () => {
    assert.equal(stripNikud('ז׳נֶבָה'), 'ז׳נבה');
    assert.equal(stripNikud('צה״ל'), 'צה״ל');
  });

  it('keeps maqaf', () => {
    assert.equal(stripNikud('בֵּית־סֵפֶר'), 'בית־ספר');
  });

  it('strips the dagesh of precomposed presentation forms', () => {
    assert.equal(stripNikud('בּ'), 'ב');
  });

  it('leaves Latin and Cyrillic text unchanged', () => {
    assert.equal(stripNikud('café Франция'), 'café Франция');
  });
});

describe('isHebrew', () => {
  it('is true for a single letter and for pointed text', () => {
    assert.equal(isHebrew('א'), true);
    assert.equal(isHebrew('שָׁלוֹם'), true);
  });

  it('is true for a precomposed presentation form', () => {
    assert.equal(isHebrew('בּ'), true);
  });

  it('is false for empty, Latin and Cyrillic strings', () => {
    assert.equal(isHebrew(''), false);
    assert.equal(isHebrew('Tsarfat'), false);
    assert.equal(isHebrew('Франция'), false);
  });

  it('is false for marks and punctuation without a letter', () => {
    assert.equal(isHebrew('ָּ'), false);
    assert.equal(isHebrew('׳־'), false);
  });
});

describe('displayHe', () => {
  it('returns he unchanged when nikud is on', () => {
    assert.equal(displayHe({ he: 'צָרְפַת', plain: 'צרפת' }, true), 'צָרְפַת');
  });

  it('prefers plain when nikud is off', () => {
    assert.equal(displayHe({ he: 'שֻׁלְחָן', plain: 'שולחן' }, false), 'שולחן');
  });

  it('strips he when nikud is off and there is no plain', () => {
    assert.equal(displayHe({ he: 'שָׁלוֹם' }, false), 'שלום');
  });
});
