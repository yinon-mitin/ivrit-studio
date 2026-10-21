// Contents: each part as a heading that opens its page, with its sections listed under it — the
// section's icon written in cursive (following the nikud setting), its title and size, each opening
// the part at that section. Below them a quiet link to the project on GitHub.
import { displayHe } from '../core/hebrew.js';
import { t, localized, countEntries } from '../core/i18n.js';
import { el, hebrew } from '../views/dom.js';

const SVG = 'http://www.w3.org/2000/svg';
const GITHUB = 'https://github.com/yinon-mitin/ivrit-studio';
// The GitHub mark (Octicons "mark-github", 16 px grid).
const MARK = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';

/** The link to the project, with the GitHub mark drawn by DOM calls (no HTML sinks). */
function sourceLink(lang) {
  const link = el('a', 'contents-source');
  link.href = GITHUB;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const mark = document.createElementNS(SVG, 'svg');
  mark.setAttribute('viewBox', '0 0 16 16');
  mark.setAttribute('width', '14');
  mark.setAttribute('height', '14');
  mark.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', MARK);
  path.setAttribute('fill', 'currentColor');
  mark.append(path);
  link.append(mark, el('span', '', t('sourceOnGithub', lang)));
  return link;
}

/**
 * @param {Array<{ id: string, title: { en: string, ru: string }, sections: Array<{ id: string,
 *   title: { en: string, ru: string }, icon?: string, nikudToggle?: boolean, items: Array<object> }> }>} parts
 *   with their sections loaded
 * @param {{ lang: 'en' | 'ru', nikud: boolean }} options
 * @returns {HTMLElement}
 */
export function renderContents(parts, { lang, nikud }) {
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
        // Sections with nikudToggle false (the alphabet) always keep their nikud.
        const icon = hebrew('span', 'contents-icon', displayHe({ he: section.icon }, nikud || section.nikudToggle === false));
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
  screen.append(title, list, sourceLink(lang));
  return screen;
}
