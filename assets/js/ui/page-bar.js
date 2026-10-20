// Page bar: sticky under the header on part pages. It names the section (and group) being read — a
// button that opens a jump list of the part's sections and groups — carries the hide-translations
// toggle, and draws a thin progress line along its bottom edge.
import { groupAnchor } from '../core/content.js';
import { t, localized } from '../core/i18n.js';
import { el } from '../views/dom.js';

/**
 * @param {{ id: string, sections: Array<{ id: string, title: { en: string, ru: string },
 *   groups?: Array<{ id: string, title?: { en: string, ru: string } }> }> }} part
 * @param {'en' | 'ru'} lang
 * @param {HTMLElement} hideToggle
 * @returns {HTMLElement}
 */
export function renderPageBar(part, lang, hideToggle) {
  const bar = el('div', 'page-bar-inner');
  const jump = el('details', 'page-jump');
  const summary = el('summary', 'page-current');
  summary.setAttribute('aria-label', t('onThisPage', lang));
  summary.append(el('span', 'page-current-section'), el('span', 'page-current-group'));
  const list = el('ul', 'page-jump-list');
  for (const section of part.sections) {
    const item = el('li', '');
    const link = el('a', 'page-jump-section', localized(section.title, lang));
    link.href = `#/${part.id}/${section.id}`;
    link.dataset.target = section.id;
    item.append(link);
    const groups = (section.groups ?? []).filter((group) => group.title);
    if (groups.length > 0) {
      const sub = el('ul', '');
      for (const group of groups) {
        const groupItem = el('li', '');
        const groupLink = el('a', 'page-jump-group', localized(group.title, lang));
        groupLink.href = `#/${part.id}/${section.id}/${group.id}`;
        groupLink.dataset.target = groupAnchor(section.id, group.id);
        groupItem.append(groupLink);
        sub.append(groupItem);
      }
      item.append(sub);
    }
    list.append(item);
  }
  const nav = el('nav', 'page-jump-panel');
  nav.setAttribute('aria-label', t('onThisPage', lang));
  nav.append(list);
  jump.append(summary, nav);

  // A link to the place already in the address bar fires no hashchange: scroll to it here.
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    jump.open = false;
    if (link.getAttribute('href') === location.hash) {
      event.preventDefault();
      document.getElementById(link.dataset.target)?.scrollIntoView();
    }
  });
  jump.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !jump.open) return;
    jump.open = false;
    summary.focus();
  });

  const progress = el('div', 'page-progress');
  progress.setAttribute('aria-hidden', 'true');
  bar.append(jump, hideToggle, progress);
  return bar;
}

/**
 * Shows where the reader is: the section's title and, inside a group, the group's.
 * @param {HTMLElement} bar the page bar container
 * @param {{ section: string, group: string | null } | null} place titles as shown on the page
 * @param {number} percent 0–100
 */
export function updatePageBar(bar, place, percent) {
  bar.style.setProperty('--progress', String(percent / 100));
  const section = bar.querySelector('.page-current-section');
  if (!section) return;
  section.textContent = place?.section ?? '';
  bar.querySelector('.page-current-group').textContent = place?.group ?? '';
}

/**
 * Closes an open jump list on a click outside it. Bound once; the bar itself is re-rendered.
 * @param {HTMLElement} root the page bar container
 */
export function bindJumpDismiss(root) {
  document.addEventListener('click', (event) => {
    const open = root.querySelector('details[open]');
    if (open && !event.composedPath().includes(open)) open.open = false;
  });
}
