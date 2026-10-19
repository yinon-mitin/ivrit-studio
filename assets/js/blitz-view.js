// Blitz screen: setup (pick an exercise), questions (choose one of up to four), results. The session
// lives here per section, so a settings change — which re-renders the screen — does not lose it.
import { buildSession, distractors, fieldValue, shuffle } from './core/blitz.js';
import { displayHe, stripNikud } from './core/hebrew.js';
import { t, localized } from './core/i18n.js';
import { record } from './core/progress.js';
import { loadProgress, saveProgress } from './progress-store.js';
import { el, hebrew } from './views/dom.js';

const ALL = 'all';
const HEBREW_FIELDS = new Set(['he', 'heCursive', 'related.he', 'forms.ms', 'forms.fs', 'forms.mp', 'forms.fp']);

/**
 * @typedef {{ phase: 'setup' | 'question' | 'results', exercise: string, session: import('./core/blitz.js').Question[],
 *   index: number, options: any[], answered: { chosenId: string, correct: boolean } | null, score: number,
 *   empty: boolean }} State
 */

/** @type {Map<string, State>} */
const states = new Map();

/** @param {string} sectionId */
function stateFor(sectionId) {
  if (!states.has(sectionId)) {
    states.set(sectionId, { phase: 'setup', exercise: ALL, session: [], index: 0, options: [], answered: null, score: 0, empty: false });
  }
  return states.get(sectionId);
}

/**
 * The visible text of a field, honouring the nikud and Russian settings.
 * @param {any} entry
 * @param {string} field
 * @param {{ nikud: boolean, showRu: boolean }} display
 */
function shown(entry, field, display) {
  if (field === 'he' || field === 'heCursive') return displayHe(entry, display.nikud);
  const value = fieldValue(entry, field, { showRu: display.showRu });
  return HEBREW_FIELDS.has(field) && !display.nikud ? stripNikud(value) : value;
}

/**
 * An element showing one field of an entry; Hebrew is marked lang="he" dir="rtl", cursive gets the
 * cursive face, emoji are shown large.
 * @param {string} tag
 * @param {string} className
 * @param {any} entry
 * @param {string} field
 * @param {{ nikud: boolean, showRu: boolean }} display
 */
function valueNode(tag, className, entry, field, display) {
  const text = shown(entry, field, display);
  const node = HEBREW_FIELDS.has(field) ? hebrew(tag, className, text) : el(tag, className, text);
  node.dataset.field = field;
  // A letter or a syllable can be drawn much larger than a phrase.
  if (stripNikud(text).length <= 3) node.dataset.short = '';
  return node;
}

/** @param {{ ask: string, answer: string }} template @param {'en' | 'ru'} lang */
const exerciseName = (template, lang) => `${t(`field_${template.ask}`, lang)} → ${t(`field_${template.answer}`, lang)}`;

/**
 * @param {{ section: any, lang: 'en' | 'ru', nikud: boolean, showRu: boolean, letters: string[] | null }} context
 *   section with its weeks merged in; letters limits the alphabet to letters covered so far
 * @returns {HTMLElement}
 */
export function renderBlitz({ section, lang, nikud, showRu, letters }) {
  const state = stateFor(section.id);
  const display = { nikud: nikud || section.nikudToggle === false, showRu };
  const title = localized(section.title, lang);
  const root = el('section', 'screen blitz');
  root.dataset.screen = 'blitz';

  const begin = () => {
    const exercises = state.exercise === ALL ? section.blitz : section.blitz.filter((template) => template.id === state.exercise);
    state.session = buildSession({ ...section, blitz: exercises }, loadProgress(), Math.random, { letters });
    state.empty = state.session.length === 0;
    if (state.empty) return paint();
    Object.assign(state, { phase: 'question', index: 0, score: 0 });
    ask();
  };

  const ask = () => {
    const question = state.session[state.index];
    const wrong = distractors(question.entry, question.template, section, loadProgress(), Math.random, { showRu: display.showRu });
    state.options = shuffle([question.entry, ...wrong], Math.random);
    state.answered = null;
    paint('[data-blitz="option"]');
  };

  const answer = (chosen) => {
    const question = state.session[state.index];
    const correct = chosen.id === question.entry.id;
    saveProgress(record(loadProgress(), question.key, correct, new Date().toISOString(), correct ? undefined : chosen.id));
    state.answered = { chosenId: chosen.id, correct };
    if (correct) state.score += 1;
    paint('[data-action="next"]');
  };

  const advance = () => {
    if (state.index + 1 < state.session.length) {
      state.index += 1;
      ask();
    } else {
      state.phase = 'results';
      paint('[data-action="again"]');
    }
  };

  function bar(extra) {
    const head = el('div', 'screen-bar');
    const back = el('a', 'back', '‹');
    back.href = `#/${section.id}`;
    back.dataset.action = 'section';
    back.setAttribute('aria-label', t('backToSection', lang, { section: title }));
    head.append(back, el('h2', 'screen-title', t('blitzIn', lang, { section: title })));
    if (extra) head.append(extra);
    return head;
  }

  function button(className, label, action, onClick) {
    const node = el('button', className, label);
    node.type = 'button';
    node.dataset.action = action;
    node.addEventListener('click', onClick);
    return node;
  }

  function setup() {
    const body = el('div', 'blitz-body blitz-setup');
    const group = el('div', 'exercise-list');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', t('exercise', lang));
    for (const [id, label] of [[ALL, t('allMixed', lang)], ...section.blitz.map((template) => [template.id, exerciseName(template, lang)])]) {
      const choice = button('control exercise', label, 'exercise', () => {
        state.exercise = id;
        state.empty = false;
        paint(`[data-template-choice="${id}"]`);
      });
      choice.dataset.templateChoice = id;
      choice.setAttribute('aria-pressed', String(state.exercise === id));
      group.append(choice);
    }
    body.append(group);
    if (state.empty) {
      const note = el('p', 'blitz-note', t('noCards', lang));
      note.setAttribute('role', 'status');
      body.append(note);
    }
    body.append(button('action blitz-start', t('start', lang), 'start', begin));
    return [bar(), body];
  }

  function question() {
    const current = state.session[state.index];
    const counter = el('span', 'blitz-counter', t('counter', lang, { n: String(state.index + 1), total: String(state.session.length) }));
    counter.dataset.blitz = 'counter';
    const body = el('div', 'blitz-body');

    const prompt = el('div', 'blitz-prompt');
    prompt.dataset.blitz = 'prompt';
    prompt.dataset.entry = current.entry.id;
    prompt.dataset.template = current.template.id;
    prompt.append(valueNode('span', 'blitz-prompt-text', current.entry, current.template.ask, display));

    const list = el('div', 'blitz-options');
    for (const option of state.options) {
      const choice = el('button', 'blitz-option');
      choice.type = 'button';
      choice.dataset.blitz = 'option';
      choice.dataset.entry = option.id;
      choice.append(valueNode('span', '', option, current.template.answer, display));
      if (state.answered) {
        choice.disabled = true;
        if (option.id === current.entry.id) choice.dataset.state = 'correct';
        else if (option.id === state.answered.chosenId) choice.dataset.state = 'wrong';
      } else {
        choice.addEventListener('click', () => answer(option));
      }
      list.append(choice);
    }

    const footer = el('div', 'blitz-footer');
    const status = el('p', 'blitz-status');
    status.setAttribute('role', 'status');
    if (state.answered) {
      status.textContent = state.answered.correct
        ? t('right', lang)
        : t('wrongAnswer', lang, { answer: shown(current.entry, current.template.answer, display) });
      status.dataset.state = state.answered.correct ? 'correct' : 'wrong';
      const last = state.index + 1 === state.session.length;
      footer.append(status, button('action', t(last ? 'finish' : 'next', lang), 'next', advance));
    } else {
      footer.append(status);
    }
    body.append(prompt, list, footer);
    return [bar(counter), body];
  }

  function results() {
    const body = el('div', 'blitz-body blitz-results');
    const score = el('p', 'blitz-score', t('score', lang, { correct: String(state.score), total: String(state.session.length) }));
    score.dataset.blitz = 'score';
    score.setAttribute('role', 'status');
    const actions = el('div', 'blitz-actions');
    actions.append(
      button('action', t('again', lang), 'again', begin),
      button('control', t('otherExercise', lang), 'setup', () => {
        state.phase = 'setup';
        paint('[data-template-choice]');
      }),
    );
    body.append(score, actions);
    return [bar(), body];
  }

  /** @param {string} [focus] selector to focus after painting */
  function paint(focus) {
    const parts = state.phase === 'question' ? question() : state.phase === 'results' ? results() : setup();
    root.replaceChildren(...parts);
    if (focus) root.querySelector(focus)?.focus();
  }

  paint();
  return root;
}
