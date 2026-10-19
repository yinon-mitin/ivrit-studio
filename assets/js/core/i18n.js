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
  backToSection: { en: 'Back to {section}', ru: 'Назад: {section}' },
  exercise: { en: 'Exercise', ru: 'Упражнение' },
  allMixed: { en: 'All mixed', ru: 'Всё вперемешку' },
  start: { en: 'Start', ru: 'Начать' },
  counter: { en: '{n} of {total}', ru: '{n} из {total}' },
  next: { en: 'Next', ru: 'Дальше' },
  finish: { en: 'See results', ru: 'К итогу' },
  right: { en: 'Right', ru: 'Верно' },
  wrongAnswer: { en: 'Not quite: {answer}', ru: 'Неверно: {answer}' },
  score: { en: '{correct} of {total} right', ru: 'Верно {correct} из {total}' },
  again: { en: 'Again', ru: 'Ещё раз' },
  otherExercise: { en: 'Other exercise', ru: 'Другое упражнение' },
  noCards: { en: 'Nothing to practise here yet.', ru: 'Здесь пока нечего тренировать.' },
  field_he: { en: 'Hebrew', ru: 'Иврит' },
  field_heCursive: { en: 'Cursive', ru: 'Пропись' },
  field_translit: { en: 'Reading', ru: 'Чтение' },
  field_meaning: { en: 'Meaning', ru: 'Значение' },
  field_emoji: { en: 'Picture', ru: 'Картинка' },
  'field_related.he': { en: 'Related words', ru: 'Связанные слова' },
  'field_forms.ms': { en: 'Masculine', ru: 'М. р.' },
  'field_forms.fs': { en: 'Feminine', ru: 'Ж. р.' },
  'field_forms.mp': { en: 'Plural (m.)', ru: 'Мн. ч. (м.)' },
  'field_forms.fp': { en: 'Plural (f.)', ru: 'Мн. ч. (ж.)' },
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
