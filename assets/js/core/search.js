// Search over the cheatsheet (SPEC Search): normalized substring match on Hebrew, reading and both
// translations; results by part and section, as sections that keep only their matches. Pure, no DOM.
import { stripNikud } from './hebrew.js';

// Geresh, gershayim and the apostrophes and quotes typed for them.
const MARKS = /[׳״'’"]/g;
// Sentence punctuation, which a search ignores: "Hey!" finds "hey", and "Ma nishma?" finds "Ma nishma".
const PUNCTUATION = /[!?.,:;…]/g;

/**
 * Text as search compares it: no nikud, no geresh or apostrophes, lowercase, single spaces.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  return stripNikud(text).replace(MARKS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Text as search matches it: normalized, and without sentence punctuation.
 * @param {string} text
 * @returns {string}
 */
export function searchKey(text) {
  return normalize(text).replace(PUNCTUATION, '').replace(/\s+/g, ' ').trim();
}

/**
 * @param {{ he: string, plain?: string, translit: string, en: string, ru: string, related?: Array<{ he: string }> }} entry
 * @param {string} query already a search key
 * @returns {boolean}
 */
export function matchesEntry(entry, query) {
  const fields = [entry.he, entry.plain, entry.translit, entry.en, entry.ru, ...(entry.related ?? []).map((word) => word.he)];
  return fields.some((field) => field !== undefined && searchKey(field).includes(query));
}

/**
 * A section with only the entries that match. Its groups shrink to those with matches; letter-rows
 * groups go, since they repeat the section's letters.
 * @param {{ view: string, groups?: Array<{ id: string, view?: string }>, items: Array<any> }} section
 * @param {string} query already a search key
 */
function filterSection(section, query) {
  const items = section.items.filter((item) => matchesEntry(item, query));
  if (section.groups === undefined) return { ...section, items };
  const groups = section.groups.filter((group) => (group.view ?? section.view) !== 'letter-rows'
    && items.some((item) => item.group === group.id));
  return { ...section, groups, items };
}

/**
 * The parts and sections with entries matching the query, in data order; empty for a blank query.
 * @template {{ items: Array<any> }} S
 * @param {Array<{ id: string, sections: S[] }>} parts with their sections loaded
 * @param {string} query as typed
 * @returns {Array<{ part: { id: string, sections: S[] }, sections: S[] }>}
 */
export function searchParts(parts, query) {
  const needle = searchKey(query);
  if (needle === '') return [];
  return parts
    .map((part) => ({ part, sections: part.sections.map((section) => filterSection(section, needle)).filter((s) => s.items.length > 0) }))
    .filter((result) => result.sections.length > 0);
}
