// letter-rows view: letters flow right to left like a line of text, each print glyph directly above
// its cursive glyph, for practising reading cursive.
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string }>} items
 * @returns {HTMLElement}
 */
export function renderLetterRows(items) {
  const rows = el('ul', 'letter-rows');
  rows.dataset.view = 'letter-rows';
  rows.dir = 'rtl';
  for (const item of items) {
    const column = el('li', 'letter-column');
    column.dataset.entry = item.id;
    column.dataset.fit = '';
    column.append(hebrew('span', 'glyph glyph-print', item.he), hebrew('span', 'glyph glyph-cursive', item.he));
    rows.append(column);
  }
  return rows;
}
