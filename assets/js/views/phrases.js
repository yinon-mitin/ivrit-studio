// phrases view: whole sentences, one card each. The meaning leads the card, so the eye has the same place
// to start every time; under it the Hebrew with its reading, one row per form (masculine and feminine
// of the same phrase share a card, each row tagged). Related words, forms and the note follow.
import { displayHe } from '../core/hebrew.js';
import { t } from '../core/i18n.js';
import { el, hebrew } from './dom.js';
import { renderForms, renderNote, renderRelated } from './list.js';
import { revealButton } from './reveal.js';

const TAGS = { m: ['tagMasculine', 'formMasculine'], f: ['tagFeminine', 'formFeminine'] };

/**
 * One form of a phrase: its tag when it has a gender, the Hebrew, and the reading under it.
 * @param {{ gender?: 'm' | 'f', he: string, plain?: string, translit: string }} form
 * @param {{ nikud: boolean, lang: 'en' | 'ru' }} options
 * @returns {HTMLElement}
 */
function renderRow(form, { nikud, lang }) {
  const row = el('div', 'phrase-row');
  if (form.gender) {
    const [short, full] = TAGS[form.gender];
    const tag = el('abbr', 'phrase-tag', t(short, lang));
    tag.title = t(full, lang);
    row.append(tag);
  }
  const text = el('div', 'phrase-text');
  text.append(hebrew('span', 'phrase-he', displayHe(form, nikud)), el('span', 'phrase-translit', form.translit));
  row.append(text);
  return row;
}

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string,
 *   variants?: Array<{ gender: 'm' | 'f', he: string, plain?: string, translit: string }>,
 *   note?: { en: string, ru: string }, forms?: Record<string, string>,
 *   related?: Array<{ he: string, plain?: string, en?: string, ru?: string }> }>} items
 * @param {{ nikud: boolean, lang: 'en' | 'ru', hide?: boolean }} options hide: reading and meaning start hidden
 * @returns {HTMLElement}
 */
export function renderPhrases(items, options) {
  const { nikud, lang, hide } = options;
  const list = el('ul', 'phrase-list');
  list.dataset.view = 'phrases';
  for (const item of items) {
    const phrase = el('li', 'phrase');
    phrase.dataset.entry = item.id;

    const meaning = el('span', 'phrase-meaning', item[lang]);
    meaning.lang = lang;
    const lead = el('p', 'phrase-lead');
    if (hide) {
      // The readings and the note stay hidden with the meaning until it is shown.
      phrase.dataset.hidden = '';
      lead.append(revealButton([meaning], lang, () => { phrase.dataset.revealed = ''; }));
    } else lead.append(meaning);
    phrase.append(lead);

    for (const form of item.variants ?? [item]) phrase.append(renderRow(form, options));
    const related = renderRelated(item, nikud, lang);
    if (related) phrase.append(related);
    if (item.forms) phrase.append(renderForms(item.forms, options));
    if (item.note) phrase.append(renderNote(item.note[lang], lang));
    list.append(phrase);
  }
  return list;
}
