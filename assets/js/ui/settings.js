// Settings: load/save through storage.js, apply to <html>, and the header controls.
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
 * Header controls: a theme button that cycles Auto → Light → Dark, and EN/RU buttons.
 * Each control has a `data-focus-key` so focus can be restored after a re-render.
 * @param {Settings} settings
 * @param {(change: Partial<Settings>) => void} onChange
 * @returns {DocumentFragment}
 */
export function renderSettings(settings, onChange) {
  const lang = settings.uiLang;
  const value = t(THEME_LABELS[settings.theme], lang);
  const theme = el('button', 'control', value);
  theme.type = 'button';
  theme.dataset.setting = 'theme';
  theme.dataset.focusKey = 'theme';
  theme.setAttribute('aria-label', t('theme', lang, { value }));
  theme.addEventListener('click', () => onChange({ theme: nextTheme(settings.theme) }));

  const languages = el('div', 'segmented');
  languages.setAttribute('role', 'group');
  languages.setAttribute('aria-label', t('language', lang));
  languages.dataset.setting = 'uiLang';
  for (const option of LANGS) {
    const button = el('button', 'control', option.toUpperCase());
    button.type = 'button';
    button.lang = option;
    button.dataset.value = option;
    button.dataset.focusKey = `uiLang-${option}`;
    button.setAttribute('aria-pressed', String(option === lang));
    button.addEventListener('click', () => onChange({ uiLang: option }));
    languages.append(button);
  }

  const fragment = document.createDocumentFragment();
  fragment.append(theme, languages);
  return fragment;
}
