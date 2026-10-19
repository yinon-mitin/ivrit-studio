// The only module that touches localStorage (SPEC Boundaries). Every access is guarded: without
// storage the site still works and values written this session live in memory until reload.

/** @type {Map<string, string>} */
const memory = new Map();

/**
 * @param {string} key
 * @returns {string | null}
 */
export function readItem(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Stores a value; it stays readable this session even when localStorage is unavailable or full.
 * @param {string} key
 * @param {string} value
 * @returns {boolean} whether the value was persisted to localStorage
 */
export function writeItem(key, value) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
