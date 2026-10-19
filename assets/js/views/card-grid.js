// card-grid view: one card per entry. The start side holds the emoji, the Hebrew, the transliteration
// and the meaning; the end side stacks the related words (e.g. a country's languages).
import { el, hebrew } from './dom.js';

/**
 * @param {Array<{ id: string, he: string, translit: string, en: string, emoji?: string,
 *   related?: Array<{ he: string }> }>} items
 * @returns {HTMLElement}
 */
export function renderCardGrid(items) {
  const grid = el('ul', 'card-grid');
  grid.dataset.view = 'card-grid';
  for (const item of items) {
    const card = el('li', 'card');
    card.dataset.entry = item.id;
    card.dataset.fit = '';
    card.dir = 'rtl';

    const main = el('div', 'card-main');
    const title = el('div', 'card-title');
    if (item.emoji) title.append(el('span', 'card-emoji', item.emoji));
    title.append(hebrew('span', 'card-he', item.he));
    const translit = el('span', 'card-line', item.translit);
    const meaning = el('span', 'card-line card-meaning', item.en);
    translit.dir = 'ltr';
    meaning.dir = 'ltr';
    main.append(title, translit, meaning);
    card.append(main);

    const related = item.related ?? [];
    if (related.length > 0) {
      const list = el('ul', 'card-related');
      list.dataset.count = String(Math.min(related.length, 4));
      for (const word of related) list.append(hebrew('li', '', word.he));
      card.append(list);
    }
    grid.append(card);
  }
  return grid;
}
