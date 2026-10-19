// Blitz progress (SPEC Progress): Leitner boxes per card, the export format, import checks, migration
// and merging two devices' progress. Pure, no DOM; every function returns new objects.

export const APP = 'ivrit-studio';
export const PROGRESS_VERSION = 1;
const MAX_BOX = 5;

/** @typedef {{ box: number, seen: number, wrong: number, lastSeen: string, confusedWith: Record<string, number> }} CardStats */
/** @typedef {{ app: string, version: number, cards: Record<string, CardStats> }} Progress */
/** @typedef {'invalid-json' | 'not-ivrit-studio' | 'newer-version' | 'invalid-format'} ParseError */

/** @returns {Progress} */
export function emptyProgress() {
  return { app: APP, version: PROGRESS_VERSION, cards: {} };
}

/**
 * Records one answer. Correct: one box up (a new card goes to box 1), at most 5. Wrong: back to box 1,
 * and what it was confused with is counted.
 * @param {Progress} progress
 * @param {string} key "<itemId>|<templateId>"
 * @param {boolean} correct
 * @param {string} now ISO timestamp
 * @param {string} [confusedWithId] the entry chosen instead, on a wrong answer
 * @returns {Progress}
 */
export function record(progress, key, correct, now, confusedWithId) {
  const card = progress.cards[key] ?? { box: 0, seen: 0, wrong: 0, lastSeen: now, confusedWith: {} };
  const confusedWith = { ...card.confusedWith };
  if (!correct && confusedWithId) confusedWith[confusedWithId] = (confusedWith[confusedWithId] ?? 0) + 1;
  const next = {
    box: correct ? Math.min(card.box + 1, MAX_BOX) : 1,
    seen: card.seen + 1,
    wrong: card.wrong + (correct ? 0 : 1),
    lastSeen: now,
    confusedWith,
  };
  return { ...progress, cards: { ...progress.cards, [key]: next } };
}

/**
 * The export file's text.
 * @param {Progress} progress
 * @param {string} now ISO timestamp for exportedAt
 * @returns {string}
 */
export function serialize(progress, now) {
  return JSON.stringify({ app: APP, version: PROGRESS_VERSION, exportedAt: now, cards: progress.cards }, null, 2);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value) => Number.isInteger(value) && value >= 0;

/** Older formats → current. Version 0 cards had only box and lastSeen. */
const MIGRATIONS = {
  0: (cards) => Object.fromEntries(Object.entries(cards).map(([key, card]) => [
    key, { seen: 0, wrong: 0, confusedWith: {}, ...card },
  ])),
};

/** @param {unknown} card */
function isCard(card) {
  return isObject(card)
    && Number.isInteger(card.box) && card.box >= 0 && card.box <= MAX_BOX
    && isCount(card.seen) && isCount(card.wrong)
    && typeof card.lastSeen === 'string' && !Number.isNaN(Date.parse(card.lastSeen))
    && isObject(card.confusedWith) && Object.values(card.confusedWith).every(isCount);
}

/**
 * Reads an export file (or pasted text). Never throws; on any problem nothing is returned to merge.
 * @param {string} text
 * @returns {{ ok: true, progress: Progress } | { ok: false, error: ParseError }}
 */
export function parse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }
  if (!isObject(data) || data.app !== APP) return { ok: false, error: 'not-ivrit-studio' };
  if (!Number.isInteger(data.version) || data.version < 0) return { ok: false, error: 'invalid-format' };
  if (data.version > PROGRESS_VERSION) return { ok: false, error: 'newer-version' };
  if (!isObject(data.cards)) return { ok: false, error: 'invalid-format' };
  let cards = data.cards;
  for (let version = data.version; version < PROGRESS_VERSION; version += 1) cards = MIGRATIONS[version](cards);
  if (!Object.values(cards).every(isCard)) return { ok: false, error: 'invalid-format' };
  return { ok: true, progress: { app: APP, version: PROGRESS_VERSION, cards } };
}

/**
 * Both devices' progress together: every card from either side; when both have a card, the more
 * recently seen record wins, and the local one on a tie.
 * @param {Progress} local
 * @param {Progress} incoming
 * @returns {Progress}
 */
export function merge(local, incoming) {
  const cards = { ...local.cards };
  for (const [key, card] of Object.entries(incoming.cards)) {
    const current = cards[key];
    if (!current || Date.parse(card.lastSeen) > Date.parse(current.lastSeen)) cards[key] = card;
  }
  return { ...local, cards };
}
