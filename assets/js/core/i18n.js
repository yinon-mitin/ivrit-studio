// Interface strings in English and Russian. Pure, no DOM.

export const LANGS = ['en', 'ru'];

/** @type {Record<string, { en: string, ru: string }>} */
export const STRINGS = {
  contents: { en: 'Contents', ru: 'Содержание' },
  parts: { en: 'Parts', ru: 'Части' },
  onThisPage: { en: 'On this page', ru: 'На этой странице' },
  settings: { en: 'Settings', ru: 'Настройки' },
  theme: { en: 'Theme: {value}', ru: 'Тема: {value}' },
  themeSystem: { en: 'Auto', ru: 'Авто' },
  themeLight: { en: 'Light', ru: 'Светлая' },
  themeDark: { en: 'Dark', ru: 'Тёмная' },
  language: { en: 'Interface language', ru: 'Язык интерфейса' },
  nikud: { en: 'Nikud', ru: 'Огласовки' },
  showRu: { en: 'Russian translation', ru: 'Перевод на русский' },
  loadError: { en: 'Could not load: {detail}', ru: 'Не удалось загрузить: {detail}' },
  home: { en: 'Contents', ru: 'Содержание' },
};

/**
 * The interface language for a browser locale: Russian for `ru` / `ru-*`, otherwise English.
 * @param {string | undefined} language e.g. navigator.language
 * @returns {'en' | 'ru'}
 */
export function pickLang(language) {
  return /^ru(-|$)/i.test(language ?? '') ? 'ru' : 'en';
}

/**
 * An interface string with `{name}` placeholders filled; the key itself when it is unknown.
 * @param {string} key
 * @param {'en' | 'ru'} lang
 * @param {Record<string, string>} [params]
 * @returns {string}
 */
export function t(key, lang, params = {}) {
  const text = STRINGS[key]?.[lang];
  if (text === undefined) return key;
  return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

/**
 * A `{ en, ru }` text from the data in the given language, falling back to English.
 * @param {{ en: string, ru?: string }} text
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export function localized(text, lang) {
  return text[lang] ?? text.en;
}

/** Entry-count nouns by plural category (Intl.PluralRules). */
const ENTRIES = {
  en: { one: 'entry', other: 'entries' },
  ru: { one: 'запись', few: 'записи', many: 'записей', other: 'записи' },
};

/**
 * "31 entries" / "31 запись", with the language's plural rules.
 * @param {number} count
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export function countEntries(count, lang) {
  const forms = ENTRIES[lang];
  return `${count} ${forms[new Intl.PluralRules(lang).select(count)] ?? forms.other}`;
}
