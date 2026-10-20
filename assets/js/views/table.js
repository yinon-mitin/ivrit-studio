// table view: one row per entry — Hebrew, sound, name — right to left. Consecutive entries with the
// same `translit` share one sound cell, so things that sound alike (kamatz/patah) read as a group.
import { displayHe } from '../core/hebrew.js';
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string }>} items
 * @param {{ nikud: boolean, showRu: boolean }} options
 * @returns {HTMLElement}
 */
export function renderTable(items, { nikud, showRu }) {
  const wrap = el('div', 'table-wrap');
  wrap.dataset.view = 'table';
  const table = el('table', 'entry-table');
  table.dir = 'rtl';
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
      const sound = el('td', 'table-sound', item.translit);
      sound.dir = 'ltr';
      sound.rowSpan = span;
      row.append(sound);
    }
    const name = el('td', 'table-name', item.en);
    name.dir = 'ltr';
    if (showRu) {
      const ru = el('span', 'table-ru', ` · ${item.ru}`);
      ru.lang = 'ru';
      name.append(ru);
    }
    row.append(name);
    body.append(row);
  });
  table.append(body);
  wrap.append(table);
  return wrap;
}
