// Tab bar of a section: one link per tab, the current one marked aria-current="page".
import { el } from '../views/dom.js';

/**
 * @param {{ id: string, tabs: Array<{ id: string, title: { en: string } }> }} section
 * @param {{ id: string }} current
 * @returns {HTMLElement}
 */
export function renderTabs(section, current) {
  const nav = el('nav', 'tabs');
  nav.setAttribute('aria-label', 'Tabs');
  for (const tab of section.tabs) {
    const link = el('a', '', tab.title.en);
    link.href = `#/${section.id}/${tab.id}`;
    if (tab.id === current.id) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  return nav;
}
