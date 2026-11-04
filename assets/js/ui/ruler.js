// Scroll ruler (laptop, long part pages), after getartcraft.com: a real-scale ruler at the right edge.
// Its tape is marked in CSS millimetres (1 mm, 5 mm, and every 10 mm numbered) and moves 1:1 with the
// page, so it measures the page from the top of the content; a fixed marker at the reading line reads
// "NNN mm", and each section is a mark on the tape. It is the page's scrollbar (role="scrollbar"):
// drag it to move the page with it, click to bring that point to the reading line; with focus,
// arrows move 10 mm, Page Up/Down a screen, Home/End to the ends. Its children are presentational for
// assistive tech; the page bar's jump list is the accessible way to reach a section.
import { t } from '../core/i18n.js';
import { PX_PER_MM, toMillimetres } from '../core/scroll.js';
import { el } from '../views/dom.js';

/** Where the marker sits below the ruler's top edge, in px: the reading line under the page bar. */
export const MARKER_OFFSET = 16;
const DRAG_THRESHOLD = 4;
/**
 * Browsers with scroll-driven animations move the tape on the compositor, in the same frame as the
 * page (CSS `animation-timeline`, see .ruler-tape). Elsewhere the tape follows the scroll event, a
 * frame or two behind.
 */
const SCROLL_LINKED = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

/**
 * Builds the ruler once and returns its controls.
 * @param {HTMLElement} root where to put it (the app container)
 * @param {{ scrollY: () => number, scrollTo: (y: number) => void, screen: () => number, range: () => number }} page
 *   the page's scroll position, a way to set it, how much of it one screen shows (Page Up/Down), and
 *   how far it can scroll (page height minus screen height)
 * @returns {{ setLang: (lang: 'en' | 'ru') => void, setActive: (active: boolean) => void,
 *   setTape: (length: number, sections: Array<{ title: string, offset: number }>) => void,
 *   update: (percent: number, title: string) => void }}
 */
export function mountRuler(root, page) {
  const ruler = el('div', 'ruler');
  ruler.id = 'ruler';
  ruler.setAttribute('role', 'scrollbar');
  ruler.setAttribute('aria-controls', 'content');
  ruler.setAttribute('aria-orientation', 'vertical');
  ruler.setAttribute('aria-valuemin', '0');
  ruler.setAttribute('aria-valuemax', '100');
  ruler.setAttribute('aria-valuenow', '0');
  ruler.tabIndex = 0;

  const tape = el('div', 'ruler-tape');
  const numbers = el('div', 'ruler-numbers');
  const marks = el('div', 'ruler-marks');
  tape.append(numbers, marks);
  const marker = el('div', 'ruler-marker');
  marker.style.setProperty('--offset', `${MARKER_OFFSET}px`);
  const value = el('span', 'ruler-value', '0 mm');
  marker.append(value);
  const title = el('span', 'ruler-title');
  ruler.append(tape, marker, title);
  root.append(ruler);

  // Drag moves the page with the tape; a press without movement is a click on that point.
  let drag = null;
  ruler.addEventListener('pointerdown', (event) => {
    ruler.setPointerCapture(event.pointerId);
    drag = { y: event.clientY, scroll: page.scrollY(), moved: false };
  });
  ruler.addEventListener('pointermove', (event) => {
    if (!drag || !ruler.hasPointerCapture(event.pointerId)) return;
    const dy = event.clientY - drag.y;
    if (Math.abs(dy) >= DRAG_THRESHOLD) drag.moved = true;
    if (drag.moved) page.scrollTo(drag.scroll - dy);
  });
  ruler.addEventListener('pointerup', (event) => {
    if (drag && !drag.moved) {
      const point = event.clientY - ruler.getBoundingClientRect().top;
      page.scrollTo(page.scrollY() + point - MARKER_OFFSET);
    }
    drag = null;
  });
  ruler.addEventListener('keydown', (event) => {
    const steps = { ArrowUp: -10 * PX_PER_MM, ArrowDown: 10 * PX_PER_MM, PageUp: -page.screen(), PageDown: page.screen() };
    let target;
    if (event.key in steps) target = page.scrollY() + steps[event.key];
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = Number.MAX_SAFE_INTEGER;
    else return;
    event.preventDefault();
    page.scrollTo(target);
  });

  // What was last written, so a frame that changes nothing touches nothing.
  let shown = { percent: -1, text: '', section: null, range: -1 };

  return {
    setLang(lang) {
      ruler.setAttribute('aria-label', t('pagePosition', lang));
    },
    setActive(active) {
      ruler.hidden = !active;
      if (active) document.documentElement.dataset.ruler = '';
      else delete document.documentElement.dataset.ruler;
    },
    setTape(length, sections) {
      shown = { percent: -1, text: '', section: null, range: -1 };
      tape.style.setProperty('--length', `${length}px`);
      const count = Math.floor(toMillimetres(length) / 10);
      numbers.replaceChildren(...Array.from({ length: count + 1 }, (_, i) => {
        const number = el('span', 'ruler-number', String(i * 10));
        number.style.setProperty('--cm', String(i));
        return number;
      }));
      marks.replaceChildren(...sections.map((section) => {
        const mark = el('span', 'ruler-mark');
        mark.style.setProperty('--offset', `${section.offset}px`);
        mark.dataset.title = section.title;
        mark.dataset.mm = String(Math.round(toMillimetres(section.offset)));
        return mark;
      }));
    },
    update(percent, current) {
      const scroll = page.scrollY();
      if (SCROLL_LINKED) {
        // The CSS animation maps the scroll range onto the tape's travel, so it must know the range.
        const range = page.range();
        if (range !== shown.range) {
          shown.range = range;
          tape.style.setProperty('--range', `${range}px`);
        }
      } else {
        tape.style.transform = `translate3d(0, ${-scroll}px, 0)`;
      }
      const mm = Math.round(toMillimetres(scroll + MARKER_OFFSET));
      const text = current ? `${mm} mm — ${current}` : `${mm} mm`;
      const rounded = Math.round(percent);
      if (rounded !== shown.percent) {
        shown.percent = rounded;
        ruler.setAttribute('aria-valuenow', String(rounded));
      }
      if (text !== shown.text) {
        shown.text = text;
        ruler.setAttribute('aria-valuetext', text);
        value.textContent = `${mm} mm`;
      }
      if (current !== shown.section) {
        shown.section = current;
        title.textContent = current;
        for (const mark of marks.children) mark.toggleAttribute('data-current', mark.dataset.title === current);
      }
    },
  };
}
