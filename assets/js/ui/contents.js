// Contents: each part as a heading that opens its page, with its sections listed under it — the
// section's icon written in cursive, its title and size, each opening the part at that section.
import { t, localized, countEntries } from '../core/i18n.js';
import { el, hebrew } from '../views/dom.js';

/**
 * @param {Array<{ id: string, title: { en: string, ru: string }, sections: Array<{ id: string,
 *   title: { en: string, ru: string }, icon?: string, items: Array<object> }> }>} parts with their sections loaded
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderContents(parts, lang) {
  const screen = el('section', 'contents');
  screen.dataset.screen = 'contents';
  screen.setAttribute('aria-labelledby', 'contents-title');
  const title = el('h2', 'visually-hidden', t('contents', lang));
  title.id = 'contents-title';
  const list = el('ol', 'contents-parts');
  for (const part of parts) {
    const entry = el('li', 'contents-part');
    entry.dataset.part = part.id;
    const heading = el('h3', 'contents-part-title');
    const open = el('a', '', localized(part.title, lang));
    open.href = `#/${part.id}`;
    heading.append(open);
    const sections = el('ul', 'contents-sections');
    for (const section of part.sections) {
      const item = el('li', '');
      const link = el('a', 'contents-section');
      link.href = `#/${part.id}/${section.id}`;
      link.dataset.section = section.id;
      if (section.icon) {
        const icon = hebrew('span', 'contents-icon', section.icon);
        icon.setAttribute('aria-hidden', 'true');
        link.append(icon);
      }
      link.append(el('span', 'contents-title', localized(section.title, lang)), el('span', 'contents-count', countEntries(section.items.length, lang)));
      item.append(link);
      sections.append(item);
    }
    entry.append(heading, sections);
    list.append(entry);
  }
  screen.append(title, list);
  return screen;
}
