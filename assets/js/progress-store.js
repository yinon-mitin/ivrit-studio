// Blitz progress in localStorage (ivrit-studio:progress), through storage.js. A missing or unreadable
// value starts empty progress, and the next answer then replaces it.
import { emptyProgress, parse, serialize } from './core/progress.js';
import { readItem, writeItem } from './storage.js';

export const PROGRESS_KEY = 'ivrit-studio:progress';

/** @returns {import('./core/progress.js').Progress} */
export function loadProgress() {
  const stored = readItem(PROGRESS_KEY);
  if (stored === null) return emptyProgress();
  const result = parse(stored);
  return result.ok ? result.progress : emptyProgress();
}

/** @param {import('./core/progress.js').Progress} progress */
export function saveProgress(progress) {
  writeItem(PROGRESS_KEY, serialize(progress, new Date().toISOString()));
}
