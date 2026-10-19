// Data contract validator (SPEC.md, Data Contract). Pure: takes parsed JSON, returns messages.
import { isHebrew } from './hebrew.js';
import { weekTabId } from './content.js';

export const VIEWS = ['letter-grid', 'letter-rows', 'card-grid', 'table'];
export const BLITZ_FIELDS = [
  'he', 'heCursive', 'translit', 'meaning', 'emoji', 'related.he', 'forms.ms', 'forms.fs', 'forms.mp', 'forms.fp',
];

const LETTER_VIEWS = ['letter-grid', 'letter-rows'];
const TAB_LIMIT = 14;
const LETTER_TAB_LIMIT = 24;
const REQUIRED = ['id', 'he', 'translit', 'en', 'ru'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LETTER = /^[א-ת]$/;

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
 * Validates one section. Week entries must already be merged into `items` (validateAll does this).
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

  for (const ref of (section.confusables ?? []).flat()) {
    if (!ids.has(ref)) errors.push(`${at}: confusables reference unknown id "${ref}"`);
  }

  const templateIds = new Set();
  for (const template of section.blitz ?? []) {
    if (templateIds.has(template.id)) errors.push(`${at}: duplicate blitz template "${template.id}"`);
    templateIds.add(template.id);
    for (const key of ['ask', 'answer']) {
      if (!BLITZ_FIELDS.includes(template[key])) errors.push(`${at}: blitz ${template.id} ${key} "${template[key]}" is not a known field`);
    }
  }

  const unverified = items.filter((item) => item.verified === false).length;
  if (unverified > 0) warnings.push(`${at}: ${unverified} entries with verified: false`);
  return { errors, warnings };
}

/**
 * Validates a week file's own fields and its section references. Its entries are checked by validateAll.
 * @param {any} week
 * @param {string[]} sectionIds
 * @returns {Report}
 */
export function validateWeek(week, sectionIds) {
  const at = `week ${week.week}`;
  const errors = [];
  if (!DATE.test(week.week ?? '')) errors.push(`${at}: week must be YYYY-MM-DD`);
  if (!Array.isArray(week.letters) || !week.letters.every((letter) => LETTER.test(letter))) {
    errors.push(`${at}: letters must be Hebrew letters`);
  }
  if (!Array.isArray(week.items)) return { errors: [...errors, `${at}: items must be an array`], warnings: [] };
  for (const item of week.items) {
    if (!sectionIds.includes(item?.section)) errors.push(`${item?.id}: unknown section "${item?.section}"`);
  }
  return { errors, warnings: [] };
}

/**
 * The section with every week's entries for it added; entries without a tab go to the week tab.
 * @param {any} section
 * @param {any[]} weeks
 */
function withWeeks(section, weeks) {
  if (!Array.isArray(section.items)) return section;
  const tabs = [...(section.tabs ?? [])];
  const items = [...section.items];
  for (const week of weeks) {
    const own = (Array.isArray(week.items) ? week.items : []).filter((item) => item?.section === section.id);
    const tabId = weekTabId(week.week);
    if (own.some((item) => item.tab === undefined)) tabs.push({ id: tabId });
    for (const { section: _section, ...item } of own) items.push({ tab: tabId, ...item });
  }
  return tabs.length > 0 ? { ...section, tabs, items } : { ...section, items };
}

/**
 * Validates all data: index.json against the files, each week, and each section with its week entries.
 * @param {{ index: any, sections: Record<string, any>, weeks: Record<string, any> }} data
 *   sections and weeks are keyed by file name without `.json`.
 * @returns {Report}
 */
export function validateAll({ index, sections, weeks }) {
  if (!Array.isArray(index?.sections) || !Array.isArray(index?.weeks)) {
    return { errors: ['index.json: needs "sections" and "weeks" arrays'], warnings: [] };
  }
  const errors = [];
  const warnings = [];
  const add = (report) => { errors.push(...report.errors); warnings.push(...report.warnings); };

  for (const [kind, listed, files] of [['section', index.sections, sections], ['week', index.weeks, weeks]]) {
    for (const name of listed) if (!(name in files)) errors.push(`index.json: ${kind} "${name}" has no file`);
    for (const name of Object.keys(files)) if (!listed.includes(name)) errors.push(`${kind}s/${name}.json is not listed in index.json`);
  }
  for (const [name, section] of Object.entries(sections)) {
    if (section.id !== name) errors.push(`sections/${name}.json: id is "${section.id}"`);
  }
  for (const [name, week] of Object.entries(weeks)) {
    if (week.week !== name) errors.push(`weeks/${name}.json: week is "${week.week}"`);
    add(validateWeek(week, Object.keys(sections)));
  }
  for (const section of Object.values(sections)) add(validateSection(withWeeks(section, Object.values(weeks))));
  return { errors, warnings };
}
