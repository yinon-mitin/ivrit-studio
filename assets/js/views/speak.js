// Speaking (SPEC Speech): a small "listen" button beside the Hebrew of a word or phrase, using the
// browser's own speech synthesis, so nothing is downloaded or sent anywhere. Buttons are always built;
// the page shows them only while the browser has a Hebrew voice (html[data-speech], set here).
import { pickVoice, speechText, SPEECH_RATE } from '../core/speech.js';
import { t } from '../core/i18n.js';
import { el } from './dom.js';

const SVG = 'http://www.w3.org/2000/svg';

/** @type {object | null} the Hebrew voice, once the browser has told us about its voices */
let voice = null;
/** @type {HTMLButtonElement | null} */
let speaking = null;

function stop() {
  window.speechSynthesis.cancel();
  speaking?.removeAttribute('data-speaking');
  speaking = null;
}

function refreshVoice() {
  voice = pickVoice(window.speechSynthesis.getVoices());
  if (voice) document.documentElement.dataset.speech = '';
  else {
    stop();
    delete document.documentElement.dataset.speech;
  }
}

/** Finds the Hebrew voice now and whenever the browser (re)loads its list; call once at start-up. */
export function initSpeech() {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  refreshVoice();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoice);
}

/** A loudspeaker drawn with the DOM API (no HTML sinks). */
function icon() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12');
  svg.append(path);
  return svg;
}

/**
 * The listen button for a Hebrew word or phrase form. A second press while it speaks stops it.
 * @param {{ he: string, plain?: string, translit: string }} entry
 * @param {'en' | 'ru'} lang language of the interface
 * @returns {HTMLButtonElement}
 */
export function speakButton(entry, lang) {
  const button = /** @type {HTMLButtonElement} */ (el('button', 'speak'));
  button.type = 'button';
  button.setAttribute('aria-label', t('speak', lang, { word: entry.translit }));
  button.append(icon());
  button.addEventListener('click', () => {
    const wasSpeaking = speaking === button;
    stop();
    if (wasSpeaking || !voice) return;
    const utterance = new SpeechSynthesisUtterance(speechText(entry));
    utterance.voice = /** @type {SpeechSynthesisVoice} */ (voice);
    utterance.lang = /** @type {SpeechSynthesisVoice} */ (voice).lang;
    utterance.rate = SPEECH_RATE;
    const done = () => {
      if (speaking === button) stop();
    };
    utterance.addEventListener('end', done);
    utterance.addEventListener('error', done);
    speaking = button;
    button.dataset.speaking = '';
    window.speechSynthesis.speak(utterance);
  });
  return button;
}
