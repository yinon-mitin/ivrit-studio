// Fetches data/ JSON once per path and caches the promise.

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
