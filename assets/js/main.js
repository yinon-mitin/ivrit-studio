// Entry point: settings, hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { resolveRoute, groupAnchor } from './core/content.js';
import { t, localized } from './core/i18n.js';
import { renderContents } from './ui/contents.js';
import { renderSection } from './ui/section.js';
import { renderPartNav, renderPartToc } from './ui/nav.js';
import { loadSettings, saveSettings, applySettings, renderSettings } from './ui/settings.js';
import { el } from './views/dom.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');
const controls = document.getElementById('controls');
const nav = document.getElementById('nav');

let settings = loadSettings();

/** @param {{ sections: string[] }} part */
const loadPart = async (part) => ({ ...part, sections: await Promise.all(part.sections.map(loadSection)) });

const screens = {
  contents: async (route, index, { lang }) => {
    document.title = APP_NAME;
    return renderContents(await Promise.all(index.parts.map(loadPart)), lang);
  },
  part: async (route, index, current) => {
    const { lang } = current;
    const part = await loadPart(index.parts.find((p) => p.id === route.part));
    const screen = el('div', 'part');
    screen.dataset.screen = 'part';
    screen.dataset.part = part.id;
    const title = el('h2', 'part-title', localized(part.title, lang));
    screen.append(title);
    if (part.sections.length > 1) screen.append(renderPartToc(part, lang));
    screen.append(...part.sections.map((section) => renderSection(section, { nikud: current.nikud, lang })));
    document.title = `${localized(part.title, lang)} — ${APP_NAME}`;
    return screen;
  },
};

/** @param {Partial<import('./core/settings.js').Settings>} change */
function updateSettings(change) {
  const focusKey = document.activeElement?.dataset?.focusKey;
  settings = { ...settings, ...change };
  saveSettings(settings);
  applySettings(settings);
  render().then(() => {
    if (focusKey) document.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  });
}

/**
 * @param {boolean} [navigated] a new route: scroll to its group or section, or to the top; a settings change keeps the place
 */
async function render(navigated = false) {
  app.dataset.ready = 'false';
  controls.replaceChildren(renderSettings(settings, updateSettings));
  try {
    const index = await loadIndex();
    const route = resolveRoute(location.hash, index);
    nav.replaceChildren(renderPartNav(index.parts, route.name === 'part' ? route.part : null, settings.lang));
    content.replaceChildren(await screens[route.name](route, index, settings));
    if (navigated) {
      // The group, else the section, else the top of the page.
      const target = (route.group && document.getElementById(groupAnchor(route.section, route.group)))
        || (route.section && document.getElementById(route.section));
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }
  } catch (error) {
    const message = el('p', '', t('loadError', settings.lang, { detail: error.message }));
    message.setAttribute('role', 'alert');
    content.replaceChildren(message);
  }
  app.dataset.ready = 'true';
}

applySettings(settings);
window.addEventListener('hashchange', () => render(true));
render(true);
