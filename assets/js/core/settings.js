// User settings (SPEC: theme, nikud, uiLang, showRu): defaults and validated parsing. Pure, no DOM.
import { LANGS, pickLang } from './i18n.js';

export const THEMES = ['system', 'light', 'dark'];
export const BLITZ_MODES = ['choice', 'cards'];

/** @typedef {{ theme: 'system' | 'light' | 'dark', nikud: boolean, uiLang: 'en' | 'ru', showRu: boolean,
 *   blitzMode: 'choice' | 'cards' }} Settings */

/**
 * @param {string | undefined} language the browser locale, e.g. navigator.language
 * @returns {Settings}
 */
export function defaultSettings(language) {
  return { theme: 'system', nikud: true, uiLang: pickLang(language), showRu: false, blitzMode: 'choice' };
}

/**
 * Settings from their stored JSON. Missing, broken or invalid values fall back to the defaults
 * field by field, so a bad stored value never breaks the site.
 * @param {string | null} stored
 * @param {string | undefined} language
 * @returns {Settings}
 */
export function parseSettings(stored, language) {
  const defaults = defaultSettings(language);
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
    uiLang: LANGS.includes(value.uiLang) ? value.uiLang : defaults.uiLang,
    showRu: typeof value.showRu === 'boolean' ? value.showRu : defaults.showRu,
    blitzMode: BLITZ_MODES.includes(value.blitzMode) ? value.blitzMode : defaults.blitzMode,
  };
}

/**
 * @param {Settings['theme']} theme
 * @returns {Settings['theme']}
 */
export function nextTheme(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
