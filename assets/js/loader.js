// Fetches data/ JSON once per path and caches the promise.
import { withWeeks } from './core/content.js';

/** @type {Map<string, Promise<any>>} */
const cache = new Map();

/**
 * @param {string} path relative to the site root
 * @returns {Promise<any>}
 */
function loadJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((response) => {
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return response.json();
    }));
  }
  return cache.get(path);
}

/** @returns {Promise<{ sections: string[], weeks: string[] }>} */
export const loadIndex = () => loadJson('data/index.json');

/**
 * @param {string} id
 * @returns {Promise<any>}
 */
export const loadSection = (id) => loadJson(`data/sections/${id}.json`);

/**
 * @param {string} date YYYY-MM-DD, as listed in index.json
 * @returns {Promise<any>}
 */
export const loadWeek = (date) => loadJson(`data/weeks/${date}.json`);

/**
 * A section with the entries of every week listed in index.json merged in (core/content.withWeeks).
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function loadSectionWithWeeks(id) {
  const index = await loadIndex();
  const [section, weeks] = await Promise.all([loadSection(id), Promise.all(index.weeks.map(loadWeek))]);
  return withWeeks(section, weeks);
}

/** @returns {Promise<any[]>} every week listed in index.json */
export async function loadWeeks() {
  const index = await loadIndex();
  return Promise.all(index.weeks.map(loadWeek));
}
