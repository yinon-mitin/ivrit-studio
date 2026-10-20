// Flowing section titles (laptop), after getartcraft.com: a fixed layer beside the ruler with the
// part's section titles — passed ones small at the top, the one being read large below them, coming
// ones small at the bottom. As the page scrolls they flow between those places (CSS transitions on
// transform). The layer lets clicks through; each title is a link to its section.
import { tocLayout } from '../core/toc.js';
import { t, localized } from '../core/i18n.js';
import { el } from '../views/dom.js';

/** Sizes of a title line, as drawn by the CSS (.flow-toc-item): small line and the current one. */
const LINE = 22;
const LARGE = 44;
const GAP = 10;

/**
 * Builds the layer once and returns its controls.
 * @param {HTMLElement} root where to put it (the app container)
 * @returns {{ setPart: (part: { id: string, sections: Array<{ id: string, title: { en: string, ru: string } }> } | null,
 *   lang: 'en' | 'ru') => void, setActive: (active: boolean) => void,
 *   update: (current: number, area: { top: number, bottom: number }) => void }}
 */
export function mountFlowToc(root) {
  const layer = el('nav', 'flow-toc');
  layer.id = 'flow-toc';
  layer.hidden = true;
  root.append(layer);
  let shown = -1;
  let size = '';

  return {
    setPart(part, lang) {
      layer.setAttribute('aria-label', t('sections', lang));
      shown = -1;
      layer.replaceChildren(...(part?.sections ?? []).map((section) => {
        const link = el('a', 'flow-toc-item', localized(section.title, lang));
        link.href = `#/${part.id}/${section.id}`;
        link.dataset.section = section.id;
        return link;
      }));
    },
    setActive(active) {
      layer.hidden = !active;
      if (active) document.documentElement.dataset.flowToc = '';
      else delete document.documentElement.dataset.flowToc;
    },
    update(current, { top, bottom }) {
      // Lay out again only when the section being read or the space changes.
      const key = `${top}:${bottom}`;
      if (current === shown && key === size) return;
      shown = current;
      size = key;
      const items = [...layer.children];
      if (items.length === 0) return;
      // The current title may wrap (a long one, drawn large): measure it to keep the others clear.
      items.forEach((item, i) => { item.dataset.state = i < current ? 'past' : i === current ? 'current' : 'upcoming'; });
      const large = Math.max(LARGE, items[current].offsetHeight * (LARGE / LINE));
      tocLayout(items.length, current, { top, bottom, line: LINE, large, gap: GAP }).forEach((place, i) => {
        items[i].style.setProperty('--y', `${place.y}px`);
        items[i].style.setProperty('--scale', String(place.scale));
        if (place.state === 'current') items[i].setAttribute('aria-current', 'location');
        else items[i].removeAttribute('aria-current');
      });
    },
  };
}
