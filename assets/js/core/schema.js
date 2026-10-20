// Data contract validator (SPEC.md, Data Contract). Pure: takes parsed JSON, returns messages.
import { isHebrew } from './hebrew.js';

export const VIEWS = ['letter-grid', 'letter-rows', 'card-grid', 'table'];

const LETTER_VIEWS = ['letter-grid', 'letter-rows'];
const TAB_LIMIT = 14;
const LETTER_TAB_LIMIT = 24;
const REQUIRED = ['id', 'he', 'translit', 'en', 'ru'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @typedef {{ errors: string[], warnings: string[] }} Report */

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim() !== '';


/**
 * @param {unknown} item
 * @param {string} sectionId
 * @returns {string[]}
 */
function validateEntry(item, sectionId) {
  if (!isObject(item)) return [`section ${sectionId}: entry must be an object`];
  const at = isText(item.id) ? item.id : `${sectionId}.?`;
  const errors = REQUIRED.filter((field) => !isText(item[field])).map((field) => `${at}: missing ${field}`);
  if (typeof item.verified !== 'boolean') errors.push(`${at}: verified must be true or false`);
  if (isText(item.id)) {
    const [prefix, slug, ...rest] = item.id.split('.');
    if (prefix !== sectionId || !SLUG.test(slug ?? '') || rest.length > 0) errors.push(`${at}: id must be "${sectionId}.<slug>"`);
  }
  if (isText(item.he) && !isHebrew(item.he)) errors.push(`${at}: he has no Hebrew letter`);
  return errors;
}

/**
 * Validates one section.
 * @param {any} section
 * @returns {Report}
 */
export function validateSection(section) {
  const at = `section ${section.id}`;
  const errors = [];
  const warnings = [];
  if (!isText(section.id) || !SLUG.test(section.id)) errors.push(`${at}: id must be a lowercase slug`);
  if (!isText(section.title?.en) || !isText(section.title?.ru)) errors.push(`${at}: title needs en and ru`);
  if (!VIEWS.includes(section.view)) errors.push(`${at}: unknown view "${section.view}"`);
  if (section.icon !== undefined && !isText(section.icon)) errors.push(`${at}: icon must be a non-empty string`);
  if (!Array.isArray(section.items)) return { errors: [...errors, `${at}: items must be an array`], warnings };

  const tabs = section.tabs ?? [];
  const tabIds = new Set(tabs.map((tab) => tab.id));
  for (const tab of tabs) {
    if (tab.view !== undefined && !VIEWS.includes(tab.view)) errors.push(`${at}: tab ${tab.id} has unknown view "${tab.view}"`);
  }

  const ids = new Set();
  for (const item of section.items) {
    errors.push(...validateEntry(item, section.id));
    if (!isObject(item)) continue;
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
    ids.add(item.id);
    if (item.tab === undefined && tabs.length > 0) errors.push(`${item.id}: needs a tab, section ${section.id} has tabs`);
    if (item.tab !== undefined && !tabIds.has(item.tab)) errors.push(`${item.id}: unknown tab "${item.tab}"`);
  }

  const items = section.items.filter(isObject);
  const groups = tabs.length > 0
    ? tabs.map((tab) => ({ name: `tab ${tab.id}`, view: tab.view ?? section.view, count: items.filter((i) => i.tab === tab.id).length }))
    : [{ name: 'items', view: section.view, count: items.length }];
  for (const { name, view, count } of groups) {
    const limit = LETTER_VIEWS.includes(view) ? LETTER_TAB_LIMIT : TAB_LIMIT;
    if (count > limit) errors.push(`${at}: ${name} has ${count} entries, limit ${limit}`);
  }

  const unverified = items.filter((item) => item.verified === false).length;
  if (unverified > 0) warnings.push(`${at}: ${unverified} entries with verified: false`);
  return { errors, warnings };
}

/**
 * Validates all data: index.json against the section files, and each section.
 * @param {{ index: any, sections: Record<string, any> }} data sections are keyed by file name without `.json`.
 * @returns {Report}
 */
export function validateAll({ index, sections }) {
  if (!Array.isArray(index?.sections)) return { errors: ['index.json: needs a "sections" array'], warnings: [] };
  const errors = [];
  const warnings = [];
  const add = (report) => { errors.push(...report.errors); warnings.push(...report.warnings); };

  for (const name of index.sections) if (!(name in sections)) errors.push(`index.json: section "${name}" has no file`);
  for (const name of Object.keys(sections)) if (!index.sections.includes(name)) errors.push(`sections/${name}.json is not listed in index.json`);
  for (const [name, section] of Object.entries(sections)) {
    if (section.id !== name) errors.push(`sections/${name}.json: id is "${section.id}"`);
  }
  for (const section of Object.values(sections)) add(validateSection(section));
  return { errors, warnings };
}
