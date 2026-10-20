// Search: the field in the header and the results screen. On a phone the field opens from a button
// in the header; on a laptop it is always there. `/` focuses it, Escape clears it. The field is built
// once (re-rendering it would lose focus and the typed text); labels follow the language.
import { t, localized, countResults } from '../core/i18n.js';
import { el } from '../views/dom.js';
import { renderSection } from './section.js';

const SVG = 'http://www.w3.org/2000/svg';

/** A magnifier icon, drawn with DOM calls (no HTML sinks). */
function magnifier() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(SVG, 'circle');
  for (const [name, value] of [['cx', '10.5'], ['cy', '10.5'], ['r', '6.5']]) circle.setAttribute(name, value);
  const handle = document.createElementNS(SVG, 'path');
  handle.setAttribute('d', 'M15.5 15.5 21 21');
  for (const shape of [circle, handle]) {
    shape.setAttribute('fill', 'none');
    shape.setAttribute('stroke', 'currentColor');
    shape.setAttribute('stroke-width', '2');
    shape.setAttribute('stroke-linecap', 'round');
  }
  svg.append(circle, handle);
  return svg;
}

/**
 * Adds the search toggle and field to the header.
 * @param {HTMLElement} header
 * @param {(query: string) => void} onQuery called on every change of the text
 * @returns {{ setLang: (lang: 'en' | 'ru') => void, setStatus: (text: string) => void, clear: () => void }}
 */
export function mountSearch(header, onQuery) {
  const toggle = el('button', 'control control-icon search-toggle');
  toggle.type = 'button';
  toggle.dataset.action = 'search';
  toggle.setAttribute('aria-controls', 'search');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.append(magnifier());

  const form = el('form', 'header-search');
  form.id = 'search';
  form.setAttribute('role', 'search');
  const label = el('label', 'visually-hidden');
  label.htmlFor = 'search-input';
  const input = el('input', 'search-input');
  input.id = 'search-input';
  input.type = 'search';
  input.autocomplete = 'off';
  input.spellcheck = false;
  const status = el('p', 'visually-hidden');
  status.setAttribute('role', 'status');
  form.append(label, input, status);

  const open = (value) => {
    header.dataset.search = value ? 'open' : '';
    toggle.setAttribute('aria-expanded', String(value));
  };
  toggle.addEventListener('click', () => {
    const opening = header.dataset.search !== 'open';
    open(opening);
    if (opening) input.focus();
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('input', () => onQuery(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    input.value = '';
    onQuery('');
    input.blur();
    open(false);
  });
  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest?.('input, textarea, select, [contenteditable]');
    if (event.key !== '/' || typing || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    open(true);
    input.focus();
  });
  header.append(toggle, form);

  return {
    setLang(lang) {
      label.textContent = t('searchLabel', lang);
      input.placeholder = t('searchPlaceholder', lang);
      toggle.setAttribute('aria-label', t('search', lang));
      toggle.title = t('search', lang);
    },
    setStatus(text) {
      status.textContent = text;
    },
    clear() {
      input.value = '';
      status.textContent = '';
      open(false);
    },
  };
}

/**
 * The results screen: a count line, then for each part with matches its sections, each led by a link
 * to its place and showing only the matching entries in the section's own views.
 * @param {Array<{ part: { id: string, title: { en: string, ru: string } }, sections: Array<any> }>} results
 * @param {string} query as typed
 * @param {{ nikud: boolean, lang: 'en' | 'ru' }} options
 * @returns {{ screen: HTMLElement, summary: string }}
 */
export function renderResults(results, query, options) {
  const { lang } = options;
  const total = results.reduce((sum, result) => sum + result.sections.reduce((n, section) => n + section.items.length, 0), 0);
  const summary = total === 0 ? t('searchNone', lang, { query: query.trim() }) : t('searchFor', lang, { count: countResults(total, lang), query: query.trim() });
  const screen = el('div', 'results');
  screen.dataset.screen = 'search';
  screen.append(el('h2', 'part-title', t('search', lang)), el('p', 'results-summary', summary));
  for (const { part, sections } of results) {
    for (const section of sections) {
      const where = el('a', 'results-where', t('searchOpen', lang, { part: localized(part.title, lang) }));
      where.href = `#/${part.id}/${section.id}`;
      const node = renderSection(section, options);
      node.querySelector('.section-title').after(where);
      screen.append(node);
    }
  }
  return { screen, summary };
}
