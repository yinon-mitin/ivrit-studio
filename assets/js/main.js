// Entry point: settings, hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { groupAnchor } from './core/content.js';
import { t, localized } from './core/i18n.js';
import { renderHome } from './ui/home.js';
import { renderSection } from './ui/section.js';
import { loadSettings, saveSettings, applySettings, renderSettings, bindMenuDismiss } from './ui/settings.js';
import { el } from './views/dom.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');
const controls = document.getElementById('controls');

let settings = loadSettings();

/**
 * `#/` home, `#/<section>/<group?>`. Anything else (an unknown section) shows home.
 * @param {string} hash
 */
function parseHash(hash) {
  const [first, second] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (first === undefined) return { name: 'home' };
  return { name: 'section', section: first, group: second };
}

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
    const screen = el('div', 'screen');
    screen.dataset.screen = 'section';
    const home = el('a', 'back', '‹');
    home.href = '#/';
    home.dataset.action = 'home';
    home.setAttribute('aria-label', t('home', lang));
    screen.append(home, renderSection(section, { nikud: current.nikud, showRu: current.showRu, lang }));
    document.title = `${localized(section.title, lang)} — ${APP_NAME}`;
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
    if (focusKey) document.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  });
}

/**
 * @param {boolean} [menuOpen] keep the settings menu open across the re-render
 * @param {boolean} [navigated] a new route: scroll to its group, or to the top; a settings change keeps the place
 */
async function render(menuOpen = false, navigated = false) {
  app.dataset.ready = 'false';
  controls.replaceChildren(renderSettings(settings, updateSettings, menuOpen));
  const route = parseHash(location.hash);
  const screen = screens[route.name] ?? screens.home;
  try {
    content.replaceChildren(await screen(route, settings));
    if (navigated) {
      const target = route.group ? document.getElementById(groupAnchor(route.section, route.group)) : null;
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }
  } catch (error) {
    const message = el('p', '', t('loadError', settings.uiLang, { detail: error.message }));
    message.setAttribute('role', 'alert');
    content.replaceChildren(message);
  }
  app.dataset.ready = 'true';
}

applySettings(settings);
bindMenuDismiss(controls);
window.addEventListener('hashchange', () => render(false, true));
render(false, true);
