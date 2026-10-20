// Interface strings in English and Russian. Pure, no DOM.

export const LANGS = ['en', 'ru'];

/** @type {Record<string, { en: string, ru: string }>} */
export const STRINGS = {
  contents: { en: 'Contents', ru: 'Содержание' },
  parts: { en: 'Parts', ru: 'Части' },
  onThisPage: { en: 'On this page', ru: 'На этой странице' },
  columnHebrew: { en: 'Hebrew', ru: 'Иврит' },
  columnSound: { en: 'Sound', ru: 'Звук' },
  columnName: { en: 'Name', ru: 'Название' },
  formSingular: { en: 'Singular', ru: 'Ед. ч.' },
  formPlural: { en: 'Plural', ru: 'Мн. ч.' },
  formMasculine: { en: 'Masc.', ru: 'М. р.' },
  formFeminine: { en: 'Fem.', ru: 'Ж. р.' },
  search: { en: 'Search', ru: 'Поиск' },
  hide: { en: 'Hide translations', ru: 'Скрыть перевод' },
  reveal: { en: 'Show translation', ru: 'Показать перевод' },
  searchLabel: { en: 'Search Hebrew, reading or translation', ru: 'Поиск по ивриту, чтению или переводу' },
  searchPlaceholder: { en: 'Search…', ru: 'Поиск…' },
  searchFor: { en: '{count} for “{query}”', ru: '{count} по запросу «{query}»' },
  searchNone: { en: 'Nothing found for “{query}”.', ru: 'По запросу «{query}» ничего не найдено.' },
  searchOpen: { en: 'Open in {part}', ru: 'Открыть в разделе «{part}»' },
  theme: { en: 'Theme: {value}', ru: 'Тема: {value}' },
  themeSystem: { en: 'Auto', ru: 'Авто' },
  themeLight: { en: 'Light', ru: 'Светлая' },
  themeDark: { en: 'Dark', ru: 'Тёмная' },
  language: { en: 'Language of the site and translations', ru: 'Язык сайта и переводов' },
  nikud: { en: 'Nikud', ru: 'Огласовки' },
  loadError: { en: 'Could not load: {detail}', ru: 'Не удалось загрузить: {detail}' },
  home: { en: 'Contents', ru: 'Содержание' },
};

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

/** Counted nouns by plural category (Intl.PluralRules). */
const NOUNS = {
  entry: {
    en: { one: 'entry', other: 'entries' },
    ru: { one: 'запись', few: 'записи', many: 'записей', other: 'записи' },
  },
  result: {
    en: { one: 'result', other: 'results' },
    ru: { one: 'результат', few: 'результата', many: 'результатов', other: 'результата' },
  },
};

/**
 * @param {number} count
 * @param {keyof NOUNS} noun
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
function countNoun(count, noun, lang) {
  const forms = NOUNS[noun][lang];
  return `${count} ${forms[new Intl.PluralRules(lang).select(count)] ?? forms.other}`;
}

/**
 * "31 entries" / "31 запись", with the language's plural rules.
 * @param {number} count
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export const countEntries = (count, lang) => countNoun(count, 'entry', lang);

/**
 * "5 results" / "5 результатов", with the language's plural rules.
 * @param {number} count
 * @param {'en' | 'ru'} lang
 * @returns {string}
 */
export const countResults = (count, lang) => countNoun(count, 'result', lang);
