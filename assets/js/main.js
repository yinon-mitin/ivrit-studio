// Entry point: hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { resolveTab, itemsForTab, viewOf } from './core/content.js';
import { renderHome } from './ui/home.js';
import { renderTabs } from './ui/tabs.js';
import { el } from './views/dom.js';
import { renderLetterGrid } from './views/letter-grid.js';
import { renderLetterRows } from './views/letter-rows.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');

/** Cheatsheet renderers by view name (SPEC: section/tab `view`). */
const VIEWS = {
  'letter-grid': renderLetterGrid,
  'letter-rows': renderLetterRows,
};

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
  home: async () => {
    const index = await loadIndex();
    document.title = APP_NAME;
    return renderHome(await Promise.all(index.sections.map(loadSection)));
  },
  section: async (route) => {
    const index = await loadIndex();
    if (!index.sections.includes(route.section)) return screens.home();
    const section = await loadSection(route.section);
    const tab = resolveTab(section, route.tab);
    const screen = el('section', 'screen');
    screen.dataset.screen = 'section';
    const head = el('div', 'screen-head');
    head.append(el('h2', 'screen-title', section.title.en));
    if (tab !== null) head.append(renderTabs(section, tab));
    screen.append(head, VIEWS[viewOf(section, tab)](itemsForTab(section, tab)));
    document.title = `${section.title.en} — ${APP_NAME}`;
    return screen;
  },
};

async function render() {
  app.dataset.ready = 'false';
  const route = parseHash(location.hash);
  const screen = screens[route.name] ?? screens.home;
  try {
    content.replaceChildren(await screen(route));
  } catch (error) {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = `Could not load: ${error.message}`;
    content.replaceChildren(message);
  }
  app.dataset.ready = 'true';
}

window.addEventListener('hashchange', render);
render();
