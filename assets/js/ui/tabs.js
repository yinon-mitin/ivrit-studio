// Tab bar of a section: one link per tab, the current one marked aria-current="page". Week tabs
// (added by content.withWeeks) have no title in the data and are named by their date.
import { t, localized, weekTitle } from '../core/i18n.js';
import { el } from '../views/dom.js';

/**
 * @param {{ id: string, tabs: Array<{ id: string, title?: { en: string, ru: string }, week?: string }> }} section
 * @param {{ id: string }} current
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderTabs(section, current, lang) {
  const nav = el('nav', 'tabs');
  nav.setAttribute('aria-label', t('tabs', lang));
  for (const tab of section.tabs) {
    const link = el('a', '', tab.week ? weekTitle(tab.week, lang) : localized(tab.title, lang));
    link.href = `#/${section.id}/${tab.id}`;
    if (tab.id === current.id) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  return nav;
}
