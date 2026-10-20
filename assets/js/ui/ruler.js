// Scroll ruler (laptop, long part pages), after getartcraft.com: a fixed strip at the right edge with
// ticks every 2% and numbers every 10%, a marker at each section, the scroll position in %, and the
// current section's title written down its side. It is the page's scrollbar (role="scrollbar"):
// click or drag to scroll there; with focus, arrows move 5%, Page Up/Down 25%, Home/End to the ends.
// Its children are presentational for assistive tech; the page bar's jump list is the accessible way
// to reach a section.
import { t } from '../core/i18n.js';
import { el } from '../views/dom.js';

const KEY_STEPS = { ArrowUp: -5, ArrowDown: 5, PageUp: -25, PageDown: 25 };

/**
 * Builds the ruler once and returns its controls.
 * @param {HTMLElement} root where to put it (the app container)
 * @param {(percent: number) => void} scrollTo scrolls the page to a percentage
 * @param {() => number} position the page's scroll percentage now (keys step from it, not from the
 *   last drawn value, which lags a frame behind fast key presses)
 * @returns {{ setLang: (lang: 'en' | 'ru') => void, setActive: (active: boolean) => void,
 *   setSections: (sections: Array<{ title: string, percent: number }>) => void,
 *   update: (percent: number, title: string) => void }}
 */
export function mountRuler(root, scrollTo, position) {
  const ruler = el('div', 'ruler');
  ruler.id = 'ruler';
  ruler.setAttribute('role', 'scrollbar');
  ruler.setAttribute('aria-controls', 'content');
  ruler.setAttribute('aria-orientation', 'vertical');
  ruler.setAttribute('aria-valuemin', '0');
  ruler.setAttribute('aria-valuemax', '100');
  ruler.setAttribute('aria-valuenow', '0');
  ruler.tabIndex = 0;

  const scale = el('div', 'ruler-scale');
  for (let n = 0; n <= 100; n += 10) {
    const number = el('span', 'ruler-number', String(n));
    number.style.setProperty('--at', String(n / 100));
    scale.append(number);
  }
  const marks = el('div', 'ruler-marks');
  const thumb = el('div', 'ruler-thumb');
  const value = el('span', 'ruler-value', '0%');
  thumb.append(value);
  const title = el('span', 'ruler-title');
  ruler.append(scale, marks, thumb, title);
  root.append(ruler);

  const fromPointer = (event) => {
    const box = scale.getBoundingClientRect();
    scrollTo(((event.clientY - box.top) / box.height) * 100);
  };
  ruler.addEventListener('pointerdown', (event) => {
    ruler.setPointerCapture(event.pointerId);
    fromPointer(event);
  });
  ruler.addEventListener('pointermove', (event) => {
    if (ruler.hasPointerCapture(event.pointerId)) fromPointer(event);
  });
  ruler.addEventListener('keydown', (event) => {
    let target;
    if (event.key in KEY_STEPS) target = position() + KEY_STEPS[event.key];
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = 100;
    else return;
    event.preventDefault();
    scrollTo(target);
  });

  return {
    setLang(lang) {
      ruler.setAttribute('aria-label', t('pagePosition', lang));
    },
    setActive(active) {
      ruler.hidden = !active;
      if (active) document.documentElement.dataset.ruler = '';
      else delete document.documentElement.dataset.ruler;
    },
    setSections(sections) {
      marks.replaceChildren(...sections.map((section) => {
        const mark = el('span', 'ruler-mark');
        mark.style.setProperty('--at', String(section.percent / 100));
        mark.dataset.percent = section.percent.toFixed(2);
        mark.dataset.title = section.title;
        return mark;
      }));
    },
    update(next, current) {
      const rounded = Math.round(next);
      ruler.setAttribute('aria-valuenow', String(rounded));
      ruler.setAttribute('aria-valuetext', current ? `${rounded}% — ${current}` : `${rounded}%`);
      thumb.style.setProperty('--at', String(next / 100));
      value.textContent = `${String(rounded).padStart(2, '0')}%`;
      title.textContent = current;
      for (const mark of marks.children) mark.toggleAttribute('data-current', mark.dataset.title === current);
    },
  };
}
