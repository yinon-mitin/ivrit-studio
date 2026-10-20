// Settings: load/save through storage.js, apply to <html>, and the header controls — nikud, the EN/RU
// switch (interface and translations together) and the theme, all visible without a menu.
import { parseSettings, nextTheme } from '../core/settings.js';
import { LANGS, t } from '../core/i18n.js';
import { readItem, writeItem } from '../storage.js';
import { el } from '../views/dom.js';

const KEY = 'ivrit-studio:settings';
const THEME_LABELS = { system: 'themeSystem', light: 'themeLight', dark: 'themeDark' };
/** The theme button shows a symbol; its accessible name says the theme in words. */
const THEME_SYMBOLS = { system: '◐', light: '☼', dark: '☾' };

/** @typedef {import('../core/settings.js').Settings} Settings */

/** @returns {Settings} */
export const loadSettings = () => parseSettings(readItem(KEY));

/** @param {Settings} settings */
export const saveSettings = (settings) => writeItem(KEY, JSON.stringify(settings));

/**
 * Theme as `data-theme` on <html> (absent = follow the system) and the language as its `lang`.
 * @param {Settings} settings
 */
export function applySettings(settings) {
  const root = document.documentElement;
  if (settings.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = settings.theme;
  root.lang = settings.lang;
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
 * Header controls. Each control has a `data-focus-key` so focus can be restored after a re-render.
 * @param {Settings} settings
 * @param {(change: Partial<Settings>) => void} onChange
 * @returns {DocumentFragment}
 */
export function renderSettings(settings, onChange) {
  const { lang } = settings;

  const nikud = button(t('nikud', lang), 'nikud', 'nikud', () => onChange({ nikud: !settings.nikud }));
  nikud.setAttribute('aria-pressed', String(settings.nikud));

  const languages = el('div', 'segmented');
  languages.setAttribute('role', 'group');
  languages.setAttribute('aria-label', t('language', lang));
  languages.dataset.setting = 'lang';
  for (const option of LANGS) {
    const choice = button(option.toUpperCase(), '', `lang-${option}`, () => onChange({ lang: option }));
    choice.lang = option;
    choice.dataset.value = option;
    choice.setAttribute('aria-pressed', String(option === lang));
    languages.append(choice);
  }

  const value = t(THEME_LABELS[settings.theme], lang);
  const theme = button(THEME_SYMBOLS[settings.theme], 'theme', 'theme', () => onChange({ theme: nextTheme(settings.theme) }));
  theme.classList.add('control-icon');
  theme.setAttribute('aria-label', t('theme', lang, { value }));
  theme.title = t('theme', lang, { value });

  const fragment = document.createDocumentFragment();
  fragment.append(nikud, languages, theme);
  return fragment;
}
