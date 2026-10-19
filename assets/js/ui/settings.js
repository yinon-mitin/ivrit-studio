// Settings: load/save through storage.js, apply to <html>, and the header controls — the nikud toggle,
// plus a ⚙ menu (a <details>) with theme, interface language and the Russian translation.
import { parseSettings, nextTheme } from '../core/settings.js';
import { LANGS, t } from '../core/i18n.js';
import { readItem, writeItem } from '../storage.js';
import { el } from '../views/dom.js';

const KEY = 'ivrit-studio:settings';
const THEME_LABELS = { system: 'themeSystem', light: 'themeLight', dark: 'themeDark' };

/** @typedef {import('../core/settings.js').Settings} Settings */

/** @returns {Settings} */
export const loadSettings = () => parseSettings(readItem(KEY), navigator.language);

/** @param {Settings} settings */
export const saveSettings = (settings) => writeItem(KEY, JSON.stringify(settings));

/**
 * Theme as `data-theme` on <html> (absent = follow the system) and the interface language as its `lang`.
 * @param {Settings} settings
 */
export function applySettings(settings) {
  const root = document.documentElement;
  if (settings.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = settings.theme;
  root.lang = settings.uiLang;
}

/**
 * @param {string} label
 * @param {string} setting
 * @param {string} focusKey
 * @param {() => void} onClick
 */
function button(label, setting, focusKey, onClick) {
  const node = el('button', 'control', label);
  node.type = 'button';
  if (setting) node.dataset.setting = setting;
  node.dataset.focusKey = focusKey;
  node.addEventListener('click', onClick);
  return node;
}

/**
 * Header controls. Each control has a `data-focus-key` so focus can be restored after a re-render,
 * and the menu is rendered open again when it was open.
 * @param {Settings} settings
 * @param {(change: Partial<Settings>) => void} onChange
 * @param {boolean} menuOpen
 * @returns {DocumentFragment}
 */
export function renderSettings(settings, onChange, menuOpen) {
  const lang = settings.uiLang;

  const nikud = button(t('nikud', lang), 'nikud', 'nikud', () => onChange({ nikud: !settings.nikud }));
  nikud.setAttribute('aria-pressed', String(settings.nikud));

  const value = t(THEME_LABELS[settings.theme], lang);
  const theme = button(value, 'theme', 'theme', () => onChange({ theme: nextTheme(settings.theme) }));
  theme.setAttribute('aria-label', t('theme', lang, { value }));

  const languages = el('div', 'segmented');
  languages.setAttribute('role', 'group');
  languages.setAttribute('aria-label', t('language', lang));
  languages.dataset.setting = 'uiLang';
  for (const option of LANGS) {
    const choice = button(option.toUpperCase(), '', `uiLang-${option}`, () => onChange({ uiLang: option }));
    choice.lang = option;
    choice.dataset.value = option;
    choice.setAttribute('aria-pressed', String(option === lang));
    languages.append(choice);
  }

  const showRu = button(t('showRu', lang), 'showRu', 'showRu', () => onChange({ showRu: !settings.showRu }));
  showRu.setAttribute('aria-pressed', String(settings.showRu));

  const menu = el('details', 'menu');
  menu.dataset.setting = 'menu';
  menu.open = menuOpen;
  const summary = el('summary', 'control', '⚙');
  summary.setAttribute('aria-label', t('settings', lang));
  summary.dataset.focusKey = 'menu';
  const progress = el('a', 'control menu-link', t('progressTitle', lang));
  progress.href = '#/progress';
  const panel = el('div', 'menu-panel');
  panel.append(theme, languages, showRu, progress);
  menu.append(summary, panel);

  const fragment = document.createDocumentFragment();
  fragment.append(nikud, menu);
  return fragment;
}

/**
 * Closes an open settings menu on Escape (focus back to its button) or on a click outside it.
 * Bound once; the menu itself is re-rendered.
 * @param {HTMLElement} root the header controls container
 */
export function bindMenuDismiss(root) {
  document.addEventListener('click', (event) => {
    const menu = root.querySelector('details[open]');
    // The path, not menu.contains(target): a click on a menu control re-renders the menu before the
    // event reaches the document, leaving the target detached; the path still holds the old menu.
    const inMenu = event.composedPath().some((node) => node.dataset?.setting === 'menu');
    if (menu && !inMenu) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    const menu = root.querySelector('details[open]');
    if (event.key !== 'Escape' || !menu) return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });
}
