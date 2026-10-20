// Data contract validator (SPEC.md, Data Contract). Pure: takes parsed JSON, returns messages.
import { isHebrew } from './hebrew.js';

export const VIEWS = ['letter-grid', 'letter-rows', 'list', 'table'];

const REQUIRED = ['id', 'he', 'translit', 'en', 'ru'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SWATCH = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

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
  if (item.swatch !== undefined && !SWATCH.test(item.swatch)) errors.push(`${at}: swatch must be #rgb or #rrggbb`);
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

  const groups = section.groups ?? [];
  const groupIds = new Set(groups.map((group) => group.id));
  for (const group of groups) {
    if (group.view !== undefined && !VIEWS.includes(group.view)) errors.push(`${at}: group ${group.id} has unknown view "${group.view}"`);
  }

  const ids = new Set();
  for (const item of section.items) {
    errors.push(...validateEntry(item, section.id));
    if (!isObject(item)) continue;
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
    ids.add(item.id);
    if (item.group === undefined && groups.length > 0) errors.push(`${item.id}: needs a group, section ${section.id} has groups`);
    if (item.group !== undefined && !groupIds.has(item.group)) errors.push(`${item.id}: unknown group "${item.group}"`);
  }

  const items = section.items.filter(isObject);
  const unverified = items.filter((item) => item.verified === false).length;
  if (unverified > 0) warnings.push(`${at}: ${unverified} entries with verified: false`);
  return { errors, warnings };
}

/**
 * Validates index.json's parts against the section files.
 * @param {any[]} parts
 * @param {string[]} files section file names without `.json`
 * @returns {string[]}
 */
function validateParts(parts, files) {
  const errors = [];
  const partIds = new Set();
  const placed = new Map();
  for (const part of parts) {
    const at = `part ${part?.id}`;
    if (!isText(part?.id) || !SLUG.test(part.id)) errors.push(`${at}: id must be a lowercase slug`);
    if (partIds.has(part?.id)) errors.push(`index.json: duplicate part "${part.id}"`);
    partIds.add(part?.id);
    if (!isText(part?.title?.en) || !isText(part?.title?.ru)) errors.push(`${at}: title needs en and ru`);
    if (!Array.isArray(part?.sections)) {
      errors.push(`${at}: sections must be an array`);
      continue;
    }
    for (const name of part.sections) {
      if (!files.includes(name)) errors.push(`${at}: section "${name}" has no file`);
      placed.set(name, (placed.get(name) ?? 0) + 1);
    }
  }
  for (const name of files) {
    if (!placed.has(name)) errors.push(`sections/${name}.json is not in any part`);
    if (placed.get(name) > 1) errors.push(`index.json: section "${name}" is in more than one part`);
  }
  return errors;
}

/**
 * Validates all data: index.json's parts against the section files, and each section.
 * @param {{ index: any, sections: Record<string, any> }} data sections are keyed by file name without `.json`.
 * @returns {Report}
 */
export function validateAll({ index, sections }) {
  if (!Array.isArray(index?.parts)) return { errors: ['index.json: needs a "parts" array'], warnings: [] };
  const errors = validateParts(index.parts, Object.keys(sections));
  const warnings = [];
  const add = (report) => { errors.push(...report.errors); warnings.push(...report.warnings); };

  for (const [name, section] of Object.entries(sections)) {
    if (section.id !== name) errors.push(`sections/${name}.json: id is "${section.id}"`);
  }
  for (const section of Object.values(sections)) add(validateSection(section));
  return { errors, warnings };
}
