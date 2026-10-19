// letter-rows view: letters flow right to left like a line of text, each print glyph directly above
// its cursive glyph, for practising reading cursive.
import { displayHe } from '../core/hebrew.js';
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, plain?: string }>} items
 * @param {{ nikud: boolean }} options
 * @returns {HTMLElement}
 */
export function renderLetterRows(items, { nikud }) {
  const rows = el('ul', 'letter-rows');
  rows.dataset.view = 'letter-rows';
  rows.dir = 'rtl';
  for (const item of items) {
    const column = el('li', 'letter-column');
    column.dataset.entry = item.id;
    column.dataset.fit = '';
    const he = displayHe(item, nikud);
    column.append(hebrew('span', 'glyph glyph-print', he), hebrew('span', 'glyph glyph-cursive', he));
    rows.append(column);
  }
  return rows;
}
