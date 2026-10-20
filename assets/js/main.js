// Entry point: settings, hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { resolveRoute, groupAnchor } from './core/content.js';
import { t, localized } from './core/i18n.js';
import { renderContents } from './ui/contents.js';
import { renderSection } from './ui/section.js';
import { loadSettings, saveSettings, applySettings, renderSettings, bindMenuDismiss } from './ui/settings.js';
import { el } from './views/dom.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');
const controls = document.getElementById('controls');

let settings = loadSettings();

/** @param {{ sections: string[] }} part */
const loadPart = async (part) => ({ ...part, sections: await Promise.all(part.sections.map(loadSection)) });

const screens = {
  contents: async (route, index, { uiLang: lang }) => {
    document.title = APP_NAME;
    return renderContents(await Promise.all(index.parts.map(loadPart)), lang);
  },
  part: async (route, index, current) => {
    const lang = current.uiLang;
    const part = await loadPart(index.parts.find((p) => p.id === route.part));
    const screen = el('div', 'part');
    screen.dataset.screen = 'part';
    screen.dataset.part = part.id;
    const title = el('h2', 'part-title', localized(part.title, lang));
    screen.append(title, ...part.sections.map((section) => renderSection(section, { nikud: current.nikud, showRu: current.showRu, lang })));
    document.title = `${localized(part.title, lang)} — ${APP_NAME}`;
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
 * @param {boolean} [navigated] a new route: scroll to its group or section, or to the top; a settings change keeps the place
 */
async function render(menuOpen = false, navigated = false) {
  app.dataset.ready = 'false';
  controls.replaceChildren(renderSettings(settings, updateSettings, menuOpen));
  try {
    const index = await loadIndex();
    const route = resolveRoute(location.hash, index);
    content.replaceChildren(await screens[route.name](route, index, settings));
    if (navigated) {
      // The group, else the section, else the top of the page.
      const target = (route.group && document.getElementById(groupAnchor(route.section, route.group)))
        || (route.section && document.getElementById(route.section));
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
