// Entry point: settings, hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { resolveRoute, groupAnchor } from './core/content.js';
import { displayHe } from './core/hebrew.js';
import { t, localized } from './core/i18n.js';
import { renderContents } from './ui/contents.js';
import { renderSection } from './ui/section.js';
import { renderPartNav, renderPartToc } from './ui/nav.js';
import { mountSearch, renderResults } from './ui/search.js';
import { renderPageBar, updatePageBar, bindJumpDismiss } from './ui/page-bar.js';
import { scrollPercent, currentAnchor } from './core/scroll.js';
import { searchParts } from './core/search.js';
import { loadSettings, saveSettings, applySettings, renderSettings, renderHideToggle } from './ui/settings.js';
import { el } from './views/dom.js';

const APP_NAME = 'Ivrit Studio';
const app = document.getElementById('app');
const content = document.getElementById('content');
const controls = document.getElementById('controls');
const nav = document.getElementById('nav');
const header = document.querySelector('.app-header');
const pageBar = document.getElementById('page-bar');
const brandMark = document.querySelector('.brand-mark');
const BRAND_HE = brandMark.textContent;
/** How long the Hebrew fades in after the nikud setting changes (matches the CSS animation). */
const NIKUD_FADE_MS = 400;
let nikudFade;

let settings = loadSettings();
/** The search text; while it is not blank, the results replace the page. */
let query = '';
/** Counts renders, so an older one that finishes late does not replace a newer screen. */
let renders = 0;
const search = mountSearch(document.querySelector('.app-header'), (value) => {
  query = value;
  render(true);
});

/** @param {{ sections: string[] }} part */
const loadPart = async (part) => ({ ...part, sections: await Promise.all(part.sections.map(loadSection)) });

const screens = {
  contents: async (route, index, { lang, nikud }) => {
    document.title = APP_NAME;
    return renderContents(await Promise.all(index.parts.map(loadPart)), { lang, nikud });
  },
  part: async (route, index, current) => {
    const { lang } = current;
    const part = await loadPart(index.parts.find((p) => p.id === route.part));
    const screen = el('div', 'part');
    screen.dataset.screen = 'part';
    screen.dataset.part = part.id;
    const title = el('h2', 'part-title', localized(part.title, lang));
    pageBar.replaceChildren(renderPageBar(part, lang, renderHideToggle(current, updateSettings)));
    screen.append(title);
    if (part.sections.length > 1) screen.append(renderPartToc(part, lang));
    screen.append(...part.sections.map((section) => renderSection(section, { nikud: current.nikud, lang, hide: current.hide })));
    document.title = `${localized(part.title, lang)} — ${APP_NAME}`;
    return screen;
  },
};

/**
 * Marks the page while the nikud setting has just changed, so Hebrew drawn now fades in (CSS) and the
 * change is easy to see. The mark goes once the re-rendered page has had time to fade in (render());
 * a second change restarts the fade.
 */
function showNikudChange() {
  const root = document.documentElement;
  clearTimeout(nikudFade);
  delete root.dataset.nikudChanged;
  void root.offsetWidth; // restart the animation on elements that stay (the header mark)
  root.dataset.nikudChanged = '';
}

/** @param {Partial<import('./core/settings.js').Settings>} change */
function updateSettings(change) {
  const focusKey = document.activeElement?.dataset?.focusKey;
  if ('nikud' in change && change.nikud !== settings.nikud) showNikudChange();
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
  const run = ++renders;
  app.dataset.ready = 'false';
  controls.replaceChildren(renderSettings(settings, updateSettings));
  brandMark.textContent = displayHe({ he: BRAND_HE }, settings.nikud);
  try {
    const index = await loadIndex();
    const route = resolveRoute(location.hash, index);
    nav.replaceChildren(renderPartNav(index.parts, route.name === 'part' ? route.part : null, settings.lang));
    search.setLang(settings.lang);
    // Part screens put their page bar back; every other screen has none.
    pageBar.replaceChildren();
    if (query.trim() !== '') {
      const parts = await Promise.all(index.parts.map(loadPart));
      const { screen, summary } = renderResults(searchParts(parts, query), query, { nikud: settings.nikud, lang: settings.lang });
      if (run !== renders) return;
      content.replaceChildren(screen);
      search.setStatus(summary);
      if (navigated) window.scrollTo(0, 0);
      return;
    }
    const screen = await screens[route.name](route, index, settings);
    if (run !== renders) return;
    search.setStatus('');
    content.replaceChildren(screen);
    if (navigated) {
      // The group, else the section, else the top of the page.
      const target = (route.group && document.getElementById(groupAnchor(route.section, route.group)))
        || (route.section && document.getElementById(route.section));
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }
    measureAnchors();
  } catch (error) {
    const message = el('p', '', t('loadError', settings.lang, { detail: error.message }));
    message.setAttribute('role', 'alert');
    content.replaceChildren(message);
  } finally {
    // A newer render that started meanwhile marks the page ready itself.
    if (run === renders) {
      app.dataset.ready = 'true';
      if ('nikudChanged' in document.documentElement.dataset) {
        clearTimeout(nikudFade);
        nikudFade = setTimeout(() => { delete document.documentElement.dataset.nikudChanged; }, NIKUD_FADE_MS);
      }
    }
  }
}

/** Sections and groups of the page on screen, with their titles and their tops (document coordinates). */
let anchors = [];

function measureAnchors() {
  anchors = [...content.querySelectorAll('.section, .group')].map((node) => {
    const section = node.closest('.section');
    return {
      top: node.getBoundingClientRect().top + window.scrollY,
      section: section.querySelector('.section-title').textContent,
      group: node.classList.contains('group') ? node.querySelector('.group-title').textContent : null,
    };
  });
  updatePosition();
}

/** Where the reader is: the bar's labels and progress line. */
function updatePosition() {
  const root = document.documentElement;
  const percent = scrollPercent(window.scrollY, root.scrollHeight, window.innerHeight);
  // 8 px below where anchors land (their scroll-margin), so a section scrolled to counts as being read.
  const reading = header.offsetHeight + pageBar.offsetHeight + 16;
  updatePageBar(pageBar, currentAnchor(anchors, window.scrollY, reading), percent);
}

let frame = 0;
window.addEventListener('scroll', () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(updatePosition);
}, { passive: true });
window.addEventListener('resize', measureAnchors);
// The sticky header and bar change height (search row, wrapping); anchors clear them via these.
const stickyHeights = new ResizeObserver(() => {
  const root = document.documentElement;
  root.style.setProperty('--header-h', `${header.offsetHeight}px`);
  root.style.setProperty('--bar-h', `${pageBar.offsetHeight}px`);
});
stickyHeights.observe(header);
stickyHeights.observe(pageBar);

applySettings(settings);
bindJumpDismiss(pageBar);
window.addEventListener('hashchange', () => {
  // Following a link (a result's place, a part) leaves the search.
  query = '';
  search.clear();
  render(true);
});
render(true);
