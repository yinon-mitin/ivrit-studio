// User settings (SPEC: theme, nikud, lang, hide): defaults and validated parsing. Pure, no DOM.
import { LANGS } from './i18n.js';

export const THEMES = ['system', 'light', 'dark'];

/** @typedef {{ theme: 'system' | 'light' | 'dark', nikud: boolean, lang: 'en' | 'ru', hide: boolean }} Settings */

/** @returns {Settings} English first, whatever the browser locale (SPEC Settings). */
export function defaultSettings() {
  return { theme: 'system', nikud: true, lang: 'en', hide: false };
}

/**
 * Settings from their stored JSON. Missing, broken or invalid values fall back to the defaults
 * field by field, so a bad stored value never breaks the site; unknown fields are dropped.
 * @param {string | null} stored
 * @returns {Settings}
 */
export function parseSettings(stored) {
  const defaults = defaultSettings();
  let value;
  try {
    value = JSON.parse(stored ?? 'null');
  } catch {
    return defaults;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaults;
  return {
    theme: THEMES.includes(value.theme) ? value.theme : defaults.theme,
    nikud: typeof value.nikud === 'boolean' ? value.nikud : defaults.nikud,
    lang: LANGS.includes(value.lang) ? value.lang : defaults.lang,
    hide: typeof value.hide === 'boolean' ? value.hide : defaults.hide,
  };
}

/**
 * @param {Settings['theme']} theme
 * @returns {Settings['theme']}
 */
export function nextTheme(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
