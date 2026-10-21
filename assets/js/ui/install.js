// Install offer: a banner at the bottom of the screen on touch phones. On Android (Chrome) it keeps the
// browser's `beforeinstallprompt` event and the button calls it; on iOS there is no such event, so it
// says how to add the site to the home screen. What to show, and when, is decided by core/install.js;
// this file listens, draws and stores. The banner is built once; labels follow the language.
import { t } from '../core/i18n.js';
import {
  parseInstallState, recordVisit, dismissOffer, markInstalled, msUntilEngaged, installOffer, isIos,
} from '../core/install.js';
import { readItem, writeItem } from '../storage.js';
import { el } from '../views/dom.js';

const KEY = 'ivrit-studio:install';
const SVG = 'http://www.w3.org/2000/svg';

/** The iOS share glyph (a box with an arrow out of it), drawn with DOM calls (no HTML sinks). */
function shareGlyph() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'install-share');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M12 15V3M8 7l4-4 4 4M7 10H5v11h14V10h-2');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

/**
 * Adds the banner (hidden until there is something to offer) and counts this load as a visit.
 * @param {HTMLElement} parent
 * @returns {{ setLang: (lang: 'en' | 'ru') => void }}
 */
export function mountInstall(parent) {
  let state = recordVisit(parseInstallState(readItem(KEY)), Date.now());
  writeItem(KEY, JSON.stringify(state));
  /** The browser's install event, kept until the button uses it (it can be used once). */
  let deferred = null;
  let kind = 'none';
  let lang = 'en';
  let timer = 0;

  const banner = el('aside', 'install');
  banner.id = 'install';
  banner.hidden = true;
  const glyph = shareGlyph();
  const text = el('p', 'install-text');
  const install = el('button', 'control install-action');
  install.type = 'button';
  const later = el('button', 'control install-later');
  later.type = 'button';
  const actions = el('div', 'install-actions');
  actions.append(install, later);
  banner.append(glyph, text, actions);
  parent.append(banner);

  const save = (next) => {
    state = next;
    writeItem(KEY, JSON.stringify(state));
  };

  function paint() {
    banner.hidden = kind === 'none';
    if (kind === 'none') delete document.documentElement.dataset.install;
    else document.documentElement.dataset.install = kind;
    banner.setAttribute('aria-label', t('installLabel', lang));
    text.textContent = t(kind === 'ios-hint' ? 'installIos' : 'installText', lang);
    glyph.style.display = kind === 'ios-hint' ? '' : 'none';
    install.hidden = kind !== 'prompt';
    install.textContent = t('installAction', lang);
    later.textContent = t(kind === 'ios-hint' ? 'installGotIt' : 'installLater', lang);
  }

  /** Decides again what to show, and when to look again if the visitor is not engaged yet. */
  function refresh() {
    clearTimeout(timer);
    const now = Date.now();
    const ios = isIos(navigator);
    kind = installOffer({
      state,
      now,
      standalone: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
      touch: ios || window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
      ios,
      canPrompt: deferred !== null,
    });
    const wait = msUntilEngaged(state, now);
    if (wait > 0) timer = setTimeout(refresh, wait);
    paint();
  }

  later.addEventListener('click', () => {
    save(dismissOffer(state, Date.now()));
    refresh();
  });
  install.addEventListener('click', async () => {
    const event = deferred;
    deferred = null;
    if (event === null) return;
    event.prompt();
    try {
      const { outcome } = await event.userChoice;
      save(outcome === 'accepted' ? markInstalled(state) : dismissOffer(state, Date.now()));
    } catch {
      // The prompt was closed without an answer: the banner just goes.
    }
    refresh();
  });
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    refresh();
  });
  window.addEventListener('appinstalled', () => {
    save(markInstalled(state));
    refresh();
  });
  refresh();

  return {
    setLang(next) {
      lang = next;
      paint();
    },
  };
}
