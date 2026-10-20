// letter-grid view: one cell per letter — print glyph, cursive glyph, name, sound (and the Russian
// name when shown) — in RTL order.
import { displayHe } from '../core/hebrew.js';
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string }>} items
 * @param {{ nikud: boolean, showRu: boolean }} options
 * @returns {HTMLElement}
 */
export function renderLetterGrid(items, { nikud, showRu }) {
  const grid = el('ul', 'letter-grid');
  grid.dataset.view = 'letter-grid';
  grid.dir = 'rtl';
  if (showRu) grid.dataset.ru = '';
  for (const item of items) {
    const cell = el('li', 'letter-cell');
    cell.dataset.entry = item.id;
    const label = el('span', 'letter-label');
    label.dir = 'ltr';
    label.append(el('span', 'letter-name', item.en), ' ', el('span', 'letter-sound', item.translit));
    if (showRu) {
      const ru = el('span', 'letter-ru', item.ru);
      ru.lang = 'ru';
      label.append(ru);
    }
    const he = displayHe(item, nikud);
    cell.append(hebrew('span', 'glyph glyph-print', he), hebrew('span', 'glyph glyph-cursive', he), label);
    grid.append(cell);
  }
  return grid;
}
