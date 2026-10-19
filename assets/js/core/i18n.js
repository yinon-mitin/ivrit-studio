// Interface strings in English and Russian. Pure, no DOM.

export const LANGS = ['en', 'ru'];

/** @type {Record<string, { en: string, ru: string }>} */
export const STRINGS = {
  sections: { en: 'Sections', ru: 'Разделы' },
  tabs: { en: 'Tabs', ru: 'Вкладки' },
  settings: { en: 'Settings', ru: 'Настройки' },
  theme: { en: 'Theme: {value}', ru: 'Тема: {value}' },
  themeSystem: { en: 'Auto', ru: 'Авто' },
  themeLight: { en: 'Light', ru: 'Светлая' },
  themeDark: { en: 'Dark', ru: 'Тёмная' },
  language: { en: 'Interface language', ru: 'Язык интерфейса' },
  nikud: { en: 'Nikud', ru: 'Огласовки' },
  showRu: { en: 'Russian translation', ru: 'Перевод на русский' },
  loadError: { en: 'Could not load: {detail}', ru: 'Не удалось загрузить: {detail}' },
  weekTab: { en: 'Week of {date}', ru: 'Неделя {date}' },
  home: { en: 'All sections', ru: 'Все разделы' },
  blitz: { en: 'Blitz', ru: 'Блиц' },
  blitzIn: { en: 'Blitz: {section}', ru: 'Блиц: {section}' },
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

/**
 * The title of a week tab, e.g. "Week of 11 Oct" / "Неделя 11 окт.". The date is read as a calendar
 * day (UTC), so the time zone cannot shift it.
 * @param {string} date YYYY-MM-DD
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export function weekTitle(date, lang) {
  const [year, month, day] = date.split('-').map(Number);
  const format = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return t('weekTab', lang, { date: format.format(Date.UTC(year, month - 1, day)) });
}

/** Card-count nouns by plural category (Intl.PluralRules). */
const CARDS = {
  en: { one: 'card', other: 'cards' },
  ru: { one: 'карточка', few: 'карточки', many: 'карточек', other: 'карточки' },
};

/**
 * "31 cards" / "31 карточка", with the language's plural rules.
 * @param {number} count
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export function countCards(count, lang) {
  const forms = CARDS[lang];
  return `${count} ${forms[new Intl.PluralRules(lang).select(count)] ?? forms.other}`;
}
