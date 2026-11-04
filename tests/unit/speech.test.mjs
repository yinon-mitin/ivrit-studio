import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, speechText, SPEECH_RATE } from '../../assets/js/core/speech.js';

const voice = (lang, localService = false) => ({ lang, localService, name: lang });

describe('pickVoice', () => {
  it('is null when the browser has no Hebrew voice, or no voices yet', () => {
    assert.equal(pickVoice([]), null);
    assert.equal(pickVoice([voice('en-US'), voice('ru-RU'), voice('hex-XX')]), null);
  });

  it('takes a Hebrew voice under any of its tags', () => {
    for (const lang of ['he-IL', 'he_IL', 'HE-il', 'he', 'iw-IL', 'iw']) {
      const hebrew = voice(lang);
      assert.equal(pickVoice([voice('en-US'), hebrew]), hebrew, lang);
    }
  });

  it('prefers a voice that runs on the device over one that is online', () => {
    const online = voice('he-IL');
    const local = voice('he-IL', true);
    assert.equal(pickVoice([online, local]), local);
    assert.equal(pickVoice([local, online]), local);
  });

  it('falls back to the first Hebrew voice when none is local', () => {
    const first = voice('he-IL');
    assert.equal(pickVoice([voice('en-US'), first, voice('he_IL')]), first);
  });
});

describe('speechText', () => {
  it('is the written form without nikud', () => {
    assert.equal(speechText({ he: 'שָׁלוֹם' }), 'שלום');
    assert.equal(speechText({ he: 'אֲנִי גָּר בְּיִשְׂרָאֵל' }), 'אני גר בישראל');
  });

  it('prefers the full spelling (plain) where the entry has one', () => {
    assert.equal(speechText({ he: 'שׁוּתָּף', plain: 'שותף' }), 'שותף');
    assert.equal(speechText({ he: 'פִּנַּת אוֹכֶל', plain: 'פינת אוכל' }), 'פינת אוכל');
  });
});

describe('SPEECH_RATE', () => {
  it('is a little slower than normal speech, within what engines accept', () => {
    assert.ok(SPEECH_RATE < 1 && SPEECH_RATE >= 0.1);
  });
});
