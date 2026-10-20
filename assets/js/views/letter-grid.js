// letter-grid view: one cell per letter — print glyph, cursive glyph, name (in the current language)
// and sound — in RTL order.
import { displayHe } from '../core/hebrew.js';
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, plain?: string, translit: string, en: string, ru: string }>} items
 * @param {{ nikud: boolean, lang: 'en' | 'ru' }} options
 * @returns {HTMLElement}
 */
export function renderLetterGrid(items, { nikud, lang }) {
  const grid = el('ul', 'letter-grid');
  grid.dataset.view = 'letter-grid';
  grid.dir = 'rtl';
  for (const item of items) {
    const cell = el('li', 'letter-cell');
    cell.dataset.entry = item.id;
    const label = el('span', 'letter-label');
    label.dir = 'ltr';
    const name = el('span', 'letter-name', item[lang]);
    name.lang = lang;
    label.append(name, ' ', el('span', 'letter-sound', item.translit));
    const he = displayHe(item, nikud);
    cell.append(hebrew('span', 'glyph glyph-print', he), hebrew('span', 'glyph glyph-cursive', he), label);
    grid.append(cell);
  }
  return grid;
}
