// letter-grid view: one cell per letter — print glyph, cursive glyph, name, sound — in RTL order.
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, translit: string, en: string }>} items
 * @returns {HTMLElement}
 */
export function renderLetterGrid(items) {
  const grid = el('ul', 'letter-grid');
  grid.dataset.view = 'letter-grid';
  grid.dir = 'rtl';
  for (const item of items) {
    const cell = el('li', 'letter-cell');
    cell.dataset.entry = item.id;
    cell.dataset.fit = '';
    const label = el('span', 'letter-label');
    label.dir = 'ltr';
    label.append(el('span', 'letter-name', item.en), ' ', el('span', 'letter-sound', item.translit));
    cell.append(hebrew('span', 'glyph glyph-print', item.he), hebrew('span', 'glyph glyph-cursive', item.he), label);
    grid.append(cell);
  }
  return grid;
}
