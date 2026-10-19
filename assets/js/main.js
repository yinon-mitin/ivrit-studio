// Entry point: settings, hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { resolveTab, itemsForTab, viewOf } from './core/content.js';
import { t, localized } from './core/i18n.js';
import { renderHome } from './ui/home.js';
import { renderTabs } from './ui/tabs.js';
import { loadSettings, saveSettings, applySettings, renderSettings, bindMenuDismiss } from './ui/settings.js';
import { el } from './views/dom.js';
import { renderCardGrid } from './views/card-grid.js';
import { renderLetterGrid } from './views/letter-grid.js';
import { renderLetterRows } from './views/letter-rows.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');
const controls = document.getElementById('controls');

/** Cheatsheet renderers by view name (SPEC: section/tab `view`). */
const VIEWS = {
  'letter-grid': renderLetterGrid,
  'letter-rows': renderLetterRows,
  'card-grid': renderCardGrid,
};

let settings = loadSettings();

/**
 * `#/` home, `#/progress`, `#/<section>/blitz`, `#/<section>/<tab?>`.
 * @param {string} hash
 */
function parseHash(hash) {
  const [first, second] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (first === undefined) return { name: 'home' };
  if (first === 'progress') return { name: 'progress' };
  if (second === 'blitz') return { name: 'blitz', section: first };
  return { name: 'section', section: first, tab: second };
}

// Blitz and progress screens arrive with their tasks; until then those routes show home.
const screens = {
  home: async (route, { uiLang: lang }) => {
    const index = await loadIndex();
    document.title = APP_NAME;
    return renderHome(await Promise.all(index.sections.map(loadSection)), lang);
  },
  section: async (route, current) => {
    const lang = current.uiLang;
    const index = await loadIndex();
    if (!index.sections.includes(route.section)) return screens.home(route, current);
    const section = await loadSection(route.section);
    const tab = resolveTab(section, route.tab);
    const title = localized(section.title, lang);
    const screen = el('section', 'screen');
    screen.dataset.screen = 'section';
    const head = el('div', 'screen-head');
    head.append(el('h2', 'screen-title', title));
    if (tab !== null) head.append(renderTabs(section, tab, lang));
    // Sections with nikudToggle false (the alphabet) always keep their nikud.
    const options = { nikud: current.nikud || section.nikudToggle === false, showRu: current.showRu };
    screen.append(head, VIEWS[viewOf(section, tab)](itemsForTab(section, tab), options));
    document.title = `${title} — ${APP_NAME}`;
    return screen;
  },
};

/** @param {Partial<import('./core/settings.js').Settings>} change */
function updateSettings(change) {
  const focusKey = document.activeElement?.dataset?.focusKey;
  const menuOpen = controls.querySelector('[data-setting="menu"]')?.open ?? false;
  settings = { ...settings, ...change };
  saveSettings(settings);
  applySettings(settings);
  render(menuOpen).then(() => {
    if (focusKey) controls.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  });
}

/** @param {boolean} [menuOpen] keep the settings menu open across the re-render */
async function render(menuOpen = false) {
  app.dataset.ready = 'false';
  controls.replaceChildren(renderSettings(settings, updateSettings, menuOpen));
  const route = parseHash(location.hash);
  const screen = screens[route.name] ?? screens.home;
  try {
    content.replaceChildren(await screen(route, settings));
  } catch (error) {
    const message = el('p', '', t('loadError', settings.uiLang, { detail: error.message }));
    message.setAttribute('role', 'alert');
    content.replaceChildren(message);
  }
  app.dataset.ready = 'true';
}

applySettings(settings);
bindMenuDismiss(controls);
window.addEventListener('hashchange', () => render());
render();
