#!/usr/bin/env node
// validate.mjs — checks every data/**/*.json against the SPEC Data Contract (assets/js/core/schema.js).
// Usage: node scripts/validate.mjs [data-dir]   (default: data)
// Exit: 0 valid (warnings allowed), 1 errors or unreadable JSON.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { validateAll } from '../assets/js/core/schema.js';

/**
 * Reads index.json and every sections/*.json, keyed by file name without `.json`.
 * Throws with the file path when a file is missing or is not valid JSON.
 * @param {string} dir
 * @returns {{ index: any, sections: Record<string, any> }}
 */
export function loadData(dir) {
  const read = (file) => {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  };
  const folder = (name) => {
    const path = join(dir, name);
    if (!existsSync(path)) return {};
    const files = readdirSync(path).filter((file) => file.endsWith('.json')).sort();
    return Object.fromEntries(files.map((file) => [basename(file, '.json'), read(join(path, file))]));
  };
  return { index: read(join(dir, 'index.json')), sections: folder('sections') };
}

if (import.meta.main) {
  const dir = process.argv[2] ?? 'data';
  let report;
  try {
    report = validateAll(loadData(dir));
  } catch (error) {
    console.error(`validate: ${error.message}`);
    process.exit(1);
  }
  for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  for (const error of report.errors) console.error(`error: ${error}`);
  console.log(`validate: ${report.errors.length} errors, ${report.warnings.length} warnings`);
  process.exit(report.errors.length > 0 ? 1 : 0);
}
