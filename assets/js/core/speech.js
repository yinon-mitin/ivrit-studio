// Speaking Hebrew: which of the browser's voices to use and what it should say. Pure, no DOM.
import { stripNikud } from './hebrew.js';

/** Hebrew voice tags: "he-IL" (and "he_IL" on some Android builds), "iw" is the old code for it. */
const HEBREW_TAG = /^(he|iw)([-_]|$)/i;

/** Slower than normal speech: the site is for people who are learning to hear the words. */
export const SPEECH_RATE = 0.85;

/**
 * The voice to speak Hebrew with: one that runs on the device (the text does not leave it), else any
 * Hebrew voice; null when the browser has none.
 * @param {Array<{ lang: string, localService?: boolean }>} voices
 * @returns {object | null} one of the given voices
 */
export function pickVoice(voices) {
  const hebrew = voices.filter((voice) => HEBREW_TAG.test(voice.lang));
  return hebrew.find((voice) => voice.localService) ?? hebrew[0] ?? null;
}

/**
 * What to say for a Hebrew entry or phrase form: the written form without nikud (`plain` when it has
 * one), which speech engines read best; a vowel mark they do not know can derail them.
 * @param {{ he: string, plain?: string }} entry
 * @returns {string}
 */
export function speechText(entry) {
  return entry.plain ?? stripNikud(entry.he);
}
