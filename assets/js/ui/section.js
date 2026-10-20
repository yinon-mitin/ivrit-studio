// A section on its page: its title, then each group under its own subheading, rendered by the group's
// view. Groups are anchors for `#/<section>/<group>`.
import { sectionGroups, groupAnchor } from '../core/content.js';
import { localized } from '../core/i18n.js';
import { el } from '../views/dom.js';
import { renderCardGrid } from '../views/card-grid.js';
import { renderTable } from '../views/table.js';
import { renderLetterGrid } from '../views/letter-grid.js';
import { renderLetterRows } from '../views/letter-rows.js';

/** Renderers by view name (SPEC: section/group `view`). */
const VIEWS = {
  'letter-grid': renderLetterGrid,
  'letter-rows': renderLetterRows,
  'card-grid': renderCardGrid,
  table: renderTable,
};

/**
 * @param {{ id: string, title: { en: string, ru: string }, nikudToggle?: boolean }} section
 * @param {{ nikud: boolean, showRu: boolean, lang: 'en' | 'ru' }} options
 * @returns {HTMLElement}
 */
export function renderSection(section, { nikud, showRu, lang }) {
  const node = el('section', 'section');
  node.id = section.id;
  node.dataset.section = section.id;
  const titleId = `${section.id}-title`;
  node.setAttribute('aria-labelledby', titleId);
  const title = el('h2', 'section-title', localized(section.title, lang));
  title.id = titleId;
  node.append(title);
  // Sections with nikudToggle false (the alphabet) always keep their nikud.
  const options = { nikud: nikud || section.nikudToggle === false, showRu };
  for (const group of sectionGroups(section)) {
    const view = VIEWS[group.view](group.items, options);
    if (group.id === null) {
      node.append(view);
      continue;
    }
    const block = el('section', 'group');
    block.id = groupAnchor(section.id, group.id);
    block.dataset.group = group.id;
    const heading = el('h3', 'group-title', localized(group.title, lang));
    heading.id = `${block.id}-title`;
    block.setAttribute('aria-labelledby', heading.id);
    block.append(heading, view);
    node.append(block);
  }
  return node;
}
