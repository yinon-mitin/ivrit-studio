// table view: a header row, then one row per entry — Hebrew, sound, name (in the current language) —
// right to left. Consecutive entries with the same `translit` share one sound cell, so things that
// sound alike (kamatz/patah) read as a group.
import { displayHe } from '../core/hebrew.js';
import { t } from '../core/i18n.js';
import { el, hebrew } from './dom.js';
import { revealButton } from './reveal.js';

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string }>} items
 * @param {{ nikud: boolean, lang: 'en' | 'ru', hide?: boolean }} options hide: sound and name start hidden
 * @returns {HTMLElement}
 */
export function renderTable(items, { nikud, lang, hide }) {
  const hidden = (text) => (hide ? [revealButton([text], lang)] : [text]);
  const wrap = el('div', 'table-wrap');
  wrap.dataset.view = 'table';
  const table = el('table', 'entry-table');
  table.dir = 'rtl';
  const head = el('tr', '');
  for (const key of ['columnHebrew', 'columnSound', 'columnName']) {
    const cell = el('th', '', t(key, lang));
    cell.scope = 'col';
    cell.dir = 'auto';
    head.append(cell);
  }
  const thead = el('thead', '');
  thead.append(head);
  const body = el('tbody', '');
  items.forEach((item, i) => {
    const row = el('tr', '');
    row.dataset.entry = item.id;
    const startsGroup = i === 0 || items[i - 1].translit !== item.translit;
    if (startsGroup && i > 0) row.className = 'group-start';
    row.append(hebrew('td', 'table-he', displayHe(item, nikud)));
    if (startsGroup) {
      let span = 1;
      while (items[i + span]?.translit === item.translit) span += 1;
      const sound = el('td', 'table-sound');
      sound.append(...hidden(item.translit));
      sound.dir = 'ltr';
      sound.rowSpan = span;
      row.append(sound);
    }
    const name = el('td', 'table-name');
    name.append(...hidden(item[lang]));
    name.dir = 'ltr';
    name.lang = lang;
    row.append(name);
    body.append(row);
  });
  table.append(thead, body);
  wrap.append(table);
  return wrap;
}
