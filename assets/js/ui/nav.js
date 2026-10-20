// Part navigation in the header: one link per part in index.json order, the current one marked
// aria-current="page". Always visible: a row of links on a laptop, a scrollable strip on a phone.
import { t, localized } from '../core/i18n.js';
import { el } from '../views/dom.js';

/**
 * @param {Array<{ id: string, title: { en: string, ru: string } }>} parts
 * @param {string | null} current the id of the part on screen, null on the contents
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderPartNav(parts, current, lang) {
  const list = el('ul', 'part-nav-list');
  for (const part of parts) {
    const item = el('li', '');
    const link = el('a', 'part-nav-link', localized(part.title, lang));
    link.href = `#/${part.id}`;
    link.dataset.part = part.id;
    if (part.id === current) link.setAttribute('aria-current', 'page');
    item.append(link);
    list.append(item);
  }
  const nav = el('nav', 'part-nav');
  nav.setAttribute('aria-label', t('parts', lang));
  nav.append(list);
  return nav;
}

/**
 * "On this page": links to the sections of a part, under its title.
 * @param {{ id: string, sections: Array<{ id: string, title: { en: string, ru: string } }> }} part
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderPartToc(part, lang) {
  const list = el('ul', 'part-toc-list');
  for (const section of part.sections) {
    const item = el('li', '');
    const link = el('a', 'part-toc-link', localized(section.title, lang));
    link.href = `#/${part.id}/${section.id}`;
    item.append(link);
    list.append(item);
  }
  const nav = el('nav', 'part-toc');
  nav.setAttribute('aria-label', t('onThisPage', lang));
  nav.append(list);
  return nav;
}
