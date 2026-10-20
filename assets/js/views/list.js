// list view: dictionary entries. Each entry is a row with the Hebrew (and a colour swatch or emoji) at
// the start (right) and its reading and meaning at the end; under it the related words with their
// meanings (a country's languages, a plural) and, for words with gender and number, a table of the
// forms (masculine/feminine × singular/plural, without a column no form fills — numbers have no plural).
import { displayHe } from '../core/hebrew.js';
import { t } from '../core/i18n.js';
import { el, hebrew } from './dom.js';
import { revealButton } from './reveal.js';

const FORM_ROWS = [['formMasculine', 'ms', 'mp'], ['formFeminine', 'fs', 'fp']];
const FORM_COLUMNS = [['formSingular', 1, ['ms', 'fs']], ['formPlural', 2, ['mp', 'fp']]];
/** A run of Hebrew inside other text, so it can be marked lang="he" dir="rtl". */
const HEBREW_RUN = /([\u0590-\u05FF][\u0590-\u05FF'"׳״־-]*)/;

/**
 * A note: text in the current language with any Hebrew in it marked up.
 * @param {string} text
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
function renderNote(text, lang) {
  const note = el('p', 'entry-note');
  note.lang = lang;
  note.dir = 'ltr';
  text.split(HEBREW_RUN).forEach((part, i) => {
    if (part) note.append(i % 2 === 1 ? hebrew('span', '', part) : part);
  });
  return note;
}

/**
 * @param {{ ms?: string, fs?: string, mp?: string, fp?: string }} forms
 * @param {{ nikud: boolean, lang: 'en' | 'ru' }} options
 * @returns {HTMLElement}
 */
function renderForms(forms, { nikud, lang }) {
  const table = el('table', 'entry-forms');
  table.dir = 'rtl';
  const head = el('tr', '');
  head.append(el('td', ''));
  const columns = FORM_COLUMNS.filter(([, , keys]) => keys.some((key) => forms[key]));
  for (const [key] of columns) {
    const cell = el('th', '', t(key, lang));
    cell.scope = 'col';
    cell.dir = 'auto';
    head.append(cell);
  }
  const thead = el('thead', '');
  thead.append(head);
  const body = el('tbody', '');
  for (const [label, single, plural] of FORM_ROWS) {
    const row = el('tr', '');
    const name = el('th', '', t(label, lang));
    name.scope = 'row';
    name.dir = 'auto';
    row.append(name);
    const cells = { 1: single, 2: plural };
    for (const [, index] of columns) {
      const form = forms[cells[index]];
      row.append(hebrew('td', '', form ? displayHe({ he: form }, nikud) : '—'));
    }
    body.append(row);
  }
  table.append(thead, body);
  return table;
}

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string, emoji?: string, swatch?: string,
 *   note?: { en: string, ru: string }, forms?: Record<string, string>,
 *   related?: Array<{ he: string, plain?: string, en?: string, ru?: string }> }>} items
 * @param {{ nikud: boolean, lang: 'en' | 'ru', hide?: boolean }} options hide: reading and meaning start hidden
 * @returns {HTMLElement}
 */
export function renderList(items, options) {
  const { nikud, lang, hide } = options;
  const list = el('ul', 'entry-list');
  list.dataset.view = 'list';
  for (const item of items) {
    const entry = el('li', 'entry');
    entry.dataset.entry = item.id;
    entry.dir = 'rtl';

    const head = el('div', 'entry-head');
    const word = el('span', 'entry-word');
    if (item.swatch) {
      // The colour itself; its name is the meaning. CSSOM, which the CSP allows (style="" it does not).
      const swatch = el('span', 'entry-swatch');
      swatch.style.setProperty('--swatch', item.swatch);
      swatch.setAttribute('aria-hidden', 'true');
      word.append(swatch);
    }
    if (item.emoji) {
      const emoji = el('span', 'entry-emoji', item.emoji);
      emoji.setAttribute('aria-hidden', 'true');
      word.append(emoji);
    }
    word.append(hebrew('span', 'entry-he', displayHe(item, nikud)));
    const gloss = el('span', 'entry-gloss');
    gloss.dir = 'ltr';
    const meaning = el('span', 'entry-meaning', item[lang]);
    meaning.lang = lang;
    const reading = [el('span', 'entry-translit', item.translit), meaning];
    if (hide) {
      // The related words' meanings and the note stay hidden with the entry's own until it is shown.
      entry.dataset.hidden = '';
      gloss.append(revealButton(reading, lang, () => { entry.dataset.revealed = ''; }));
    } else gloss.append(...reading);
    head.append(word, gloss);
    entry.append(head);

    // Words with forms show them as a table; related words that are just those forms are left out.
    const formWords = new Set(Object.values(item.forms ?? {}));
    const related = (item.related ?? []).filter((other) => !formWords.has(other.he));
    if (related.length > 0) {
      const words = el('ul', 'entry-related');
      for (const word of related) {
        const line = el('li', '');
        line.append(hebrew('span', 'entry-related-he', displayHe(word, nikud)));
        if (word[lang]) {
          const sense = el('span', 'entry-related-gloss', word[lang]);
          sense.lang = lang;
          sense.dir = 'ltr';
          line.append(sense);
        }
        words.append(line);
      }
      entry.append(words);
    }
    if (item.forms) entry.append(renderForms(item.forms, options));
    if (item.note) entry.append(renderNote(item.note[lang], lang));
    list.append(entry);
  }
  return list;
}
