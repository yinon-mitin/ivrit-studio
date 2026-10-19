// Blitz (SPEC Behaviour Contracts): which cards to ask, in what order, and the look-alike wrong options.
// Pure, no DOM; randomness comes from an injected rng() in [0, 1) so tests are deterministic.
import { stripNikud } from './hebrew.js';

export const SESSION_SIZE = 10;
export const MAX_NEW = 3;
/** Pick weight by Leitner box: unseen cards (0) are introduced gently, mistakes (1) come back most. */
export const WEIGHTS = { 0: 4, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1 };
const OPTIONS = 3;

/** @typedef {{ ask: string, answer: string, id: string }} Template */
/** @typedef {{ key: string, entry: any, template: Template }} Question */

/**
 * The text of an entry for a Blitz field (SPEC: he, heCursive, translit, meaning, emoji, related.he,
 * forms.<ms|fs|mp|fp>). Undefined when the entry lacks it, so that card is not played.
 * @param {any} entry
 * @param {string} field
 * @param {{ showRu?: boolean }} [options]
 * @returns {string | undefined}
 */
export function fieldValue(entry, field, { showRu = false } = {}) {
  switch (field) {
    case 'he':
    case 'heCursive':
      return entry.he;
    case 'translit':
      return entry.translit;
    case 'meaning':
      return showRu ? `${entry.en} / ${entry.ru}` : entry.en;
    case 'emoji':
      return entry.emoji;
    case 'related.he':
      return entry.related?.length ? entry.related.map((word) => word.he).join(', ') : undefined;
    default:
      return field.startsWith('forms.') ? entry.forms?.[field.slice('forms.'.length)] : undefined;
  }
}

/**
 * Every playable card "<itemId>|<templateId>" of a section. With `letters` (the alphabet once weeks
 * exist), only entries whose letter has been covered.
 * @param {{ items: any[], blitz?: Template[] }} section
 * @param {string[] | null} [letters]
 * @returns {string[]}
 */
export function cardKeys(section, letters = null) {
  const items = letters ? section.items.filter((item) => letters.includes(stripNikud(item.he))) : section.items;
  const keys = [];
  for (const template of section.blitz ?? []) {
    for (const item of items) {
      if (fieldValue(item, template.ask) !== undefined && fieldValue(item, template.answer) !== undefined) keys.push(`${item.id}|${template.id}`);
    }
  }
  return keys;
}

/**
 * @template T
 * @param {T[]} list
 * @param {() => number} rng
 * @returns {T[]} a shuffled copy (Fisher–Yates)
 */
export function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A session of SESSION_SIZE questions. The pool is every card already seen plus at most MAX_NEW new
 * ones; questions are drawn from it by box weight, repeating cards when the pool is small but never
 * the same card twice in a row (unless it is the only one).
 * @param {{ id: string, items: any[], blitz?: Template[] }} section with its weeks merged in
 * @param {import('./progress.js').Progress} progress
 * @param {() => number} rng
 * @param {{ letters?: string[] | null }} [options]
 * @returns {Question[]}
 */
export function buildSession(section, progress, rng, { letters = null } = {}) {
  const keys = cardKeys(section, letters);
  const known = keys.filter((key) => key in progress.cards);
  const fresh = shuffle(keys.filter((key) => !(key in progress.cards)), rng).slice(0, MAX_NEW);
  const pool = [...known, ...fresh];
  if (pool.length === 0) return [];

  const weight = (key) => WEIGHTS[progress.cards[key]?.box ?? 0];
  const items = new Map(section.items.map((item) => [item.id, item]));
  const templates = new Map(section.blitz.map((template) => [template.id, template]));
  const session = [];
  while (session.length < SESSION_SIZE) {
    const previous = session.at(-1)?.key;
    const options = pool.length > 1 ? pool.filter((key) => key !== previous) : pool;
    let target = rng() * options.reduce((sum, key) => sum + weight(key), 0);
    const key = options.find((candidate) => (target -= weight(candidate)) < 0) ?? options.at(-1);
    const [itemId, templateId] = key.split('|');
    session.push({ key, entry: items.get(itemId), template: templates.get(templateId) });
  }
  return session;
}

/**
 * Up to three wrong options that look like the right one, in priority order: what this learner has
 * confused it with (most often first), its confusable group, its tab, then the rest of the section.
 * No option repeats the answer text of the correct one or of another option.
 * @param {any} entry
 * @param {Template} template
 * @param {{ items: any[], confusables?: string[][] }} section
 * @param {import('./progress.js').Progress} progress
 * @param {() => number} rng
 * @param {{ showRu?: boolean }} [options]
 * @returns {any[]}
 */
export function distractors(entry, template, section, progress, rng, options = {}) {
  const answer = (item) => fieldValue(item, template.answer, options);
  const byId = new Map(section.items.map((item) => [item.id, item]));
  const confusedWith = progress.cards[`${entry.id}|${template.id}`]?.confusedWith ?? {};
  const personal = Object.entries(confusedWith).sort((a, b) => b[1] - a[1]).map(([id]) => byId.get(id));
  const group = shuffle((section.confusables ?? []).filter((ids) => ids.includes(entry.id)).flat().map((id) => byId.get(id)), rng);
  const sameTab = shuffle(section.items.filter((item) => item.tab === entry.tab), rng);
  const rest = shuffle(section.items, rng);

  const chosen = [];
  const used = new Set([answer(entry)]);
  for (const candidate of [...personal, ...group, ...sameTab, ...rest]) {
    if (chosen.length === OPTIONS) break;
    if (!candidate || candidate.id === entry.id) continue;
    const value = answer(candidate);
    if (value === undefined || used.has(value)) continue;
    used.add(value);
    chosen.push(candidate);
  }
  return chosen;
}
