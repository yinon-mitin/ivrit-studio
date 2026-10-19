// Home screen: one link per section, in index.json order.
import { t, localized } from '../core/i18n.js';

/**
 * @param {Array<{ id: string, title: { en: string, ru: string } }>} sections
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderHome(sections, lang) {
  const screen = document.createElement('section');
  screen.dataset.screen = 'home';
  screen.setAttribute('aria-labelledby', 'home-title');
  const title = document.createElement('h2');
  title.id = 'home-title';
  title.className = 'screen-title';
  title.textContent = t('sections', lang);
  const list = document.createElement('ul');
  list.className = 'home-grid';
  for (const section of sections) {
    const link = document.createElement('a');
    link.href = `#/${section.id}`;
    link.dataset.section = section.id;
    link.textContent = localized(section.title, lang);
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  screen.append(title, list);
  return screen;
}
