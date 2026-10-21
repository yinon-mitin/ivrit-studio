// Back to top: a quiet round button in the corner, shown once the page has scrolled more than one
// screen. A click scrolls to the top (at once under reduced motion) and puts the focus on the site
// name link, so a keyboard user is not left on a button that has just gone. When to show it is decided by
// core/scroll.js; this file draws and listens.
import { t } from '../core/i18n.js';
import { showBackToTop } from '../core/scroll.js';
import { el } from '../views/dom.js';

const SVG = 'http://www.w3.org/2000/svg';

/** An up chevron, drawn with DOM calls (no HTML sinks). */
function chevron() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M6 15l6-6 6 6');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

/**
 * Adds the button (hidden until the page has scrolled).
 * @param {HTMLElement} parent
 * @param {HTMLElement} home what gets the focus after the jump to the top
 * @returns {{ update: (scrollY: number, viewportHeight: number) => void, setLang: (lang: 'en' | 'ru') => void }}
 */
export function mountBackToTop(parent, home) {
  const button = el('button', 'to-top');
  button.type = 'button';
  button.hidden = true;
  button.append(chevron());
  parent.append(button);

  button.addEventListener('click', () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    home.focus({ preventScroll: true });
  });

  return {
    update(scrollY, viewportHeight) {
      button.hidden = !showBackToTop(scrollY, viewportHeight);
    },
    setLang(lang) {
      button.setAttribute('aria-label', t('backToTop', lang));
    },
  };
}
