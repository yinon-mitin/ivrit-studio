// Home screen: one tile per section, in index.json order — the section's icon written in cursive
// "ink", its title and size (the tile opens the section), and a Blitz link when it has Blitz.
import { t, localized, countCards } from '../core/i18n.js';
import { el, hebrew } from '../views/dom.js';

/**
 * @param {Array<{ id: string, title: { en: string, ru: string }, icon?: string, blitz?: Array<object>,
 *   items: Array<object> }>} sections with their weeks merged in
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderHome(sections, lang) {
  const screen = el('section', 'home');
  screen.dataset.screen = 'home';
  screen.setAttribute('aria-labelledby', 'home-title');
  const title = el('h2', 'screen-title visually-hidden', t('sections', lang));
  title.id = 'home-title';
  const list = el('ul', 'home-grid');
  for (const section of sections) {
    const tile = el('li', 'tile');
    tile.dataset.tile = section.id;
    const open = el('a', 'tile-open');
    open.href = `#/${section.id}`;
    open.dataset.section = section.id;
    if (section.icon) {
      const icon = hebrew('span', 'tile-icon', section.icon);
      icon.setAttribute('aria-hidden', 'true');
      open.append(icon);
    }
    open.append(el('span', 'tile-title', localized(section.title, lang)), el('span', 'tile-count', countCards(section.items.length, lang)));
    tile.append(open);
    if ((section.blitz ?? []).length > 0) {
      const blitz = el('a', 'tile-blitz', t('blitz', lang));
      blitz.href = `#/${section.id}/blitz`;
      blitz.dataset.action = 'blitz';
      blitz.setAttribute('aria-label', t('blitzIn', lang, { section: localized(section.title, lang) }));
      tile.append(blitz);
    }
    list.append(tile);
  }
  screen.append(title, list);
  return screen;
}
