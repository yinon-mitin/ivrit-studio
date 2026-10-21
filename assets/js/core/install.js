// When to offer installing the site as an app (SPEC Install): the state kept between visits and the
// decision from it. Pure, no DOM; the clock and the device come in as arguments.

/** A dismissal keeps the offer away this long (30 days). */
export const SNOOZE_MS = 30 * 24 * 3600 * 1000;
/** On a first visit the offer waits this long (30 s) before it shows. */
export const ENGAGED_MS = 30 * 1000;
/** Loads closer together than this (30 min) are one visit. */
export const VISIT_GAP_MS = 30 * 60 * 1000;

/**
 * @typedef {{ visits: number, firstSeen: number, lastSeen: number, dismissedAt: number, installed: boolean }} InstallState
 *   times are milliseconds since the epoch; 0 means never
 */

/** @returns {InstallState} */
export function defaultInstallState() {
  return { visits: 0, firstSeen: 0, lastSeen: 0, dismissedAt: 0, installed: false };
}

const count = (value, fallback) => (Number.isFinite(value) && value >= 0 ? value : fallback);

/**
 * The state from its stored JSON. Missing, broken or invalid values fall back to the defaults field by
 * field, so a bad stored value never breaks the site; unknown fields are dropped.
 * @param {string | null} stored
 * @returns {InstallState}
 */
export function parseInstallState(stored) {
  const defaults = defaultInstallState();
  let value;
  try {
    value = JSON.parse(stored ?? 'null');
  } catch {
    return defaults;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaults;
  return {
    visits: count(value.visits, defaults.visits),
    firstSeen: count(value.firstSeen, defaults.firstSeen),
    lastSeen: count(value.lastSeen, defaults.lastSeen),
    dismissedAt: count(value.dismissedAt, defaults.dismissedAt),
    installed: typeof value.installed === 'boolean' ? value.installed : defaults.installed,
  };
}

/**
 * The state after a page load: a new visit unless the last load was less than VISIT_GAP_MS ago.
 * @param {InstallState} state
 * @param {number} now
 * @returns {InstallState}
 */
export function recordVisit(state, now) {
  const fresh = state.visits === 0 || now - state.lastSeen >= VISIT_GAP_MS;
  return {
    ...state,
    visits: fresh ? state.visits + 1 : state.visits,
    firstSeen: state.firstSeen === 0 ? now : state.firstSeen,
    lastSeen: now,
  };
}

/**
 * @param {InstallState} state
 * @param {number} now
 * @returns {InstallState}
 */
export const dismissOffer = (state, now) => ({ ...state, dismissedAt: now });

/**
 * @param {InstallState} state
 * @returns {InstallState}
 */
export const markInstalled = (state) => ({ ...state, installed: true });

/**
 * How long until the visitor counts as engaged: 0 from the second visit, else what is left of the
 * first 30 s since the site was first seen.
 * @param {InstallState} state
 * @param {number} now
 * @returns {number}
 */
export function msUntilEngaged(state, now) {
  return state.visits >= 2 ? 0 : Math.max(0, state.firstSeen + ENGAGED_MS - now);
}

/**
 * What to show: the browser's own install prompt (`'prompt'`), the hint for iOS, where there is no
 * prompt to call (`'ios-hint'`), or nothing. Nothing in the installed app, without touch, once
 * installed, within 30 days of a dismissal, or before the visitor is engaged.
 * @param {{ state: InstallState, now: number, standalone: boolean, touch: boolean, ios: boolean, canPrompt: boolean }} input
 * @returns {'prompt' | 'ios-hint' | 'none'}
 */
export function installOffer({ state, now, standalone, touch, ios, canPrompt }) {
  if (standalone || !touch || state.installed) return 'none';
  if (state.dismissedAt > 0 && now - state.dismissedAt < SNOOZE_MS) return 'none';
  if (msUntilEngaged(state, now) > 0) return 'none';
  if (canPrompt) return 'prompt';
  return ios ? 'ios-hint' : 'none';
}

/**
 * Whether the device is an iPhone, iPad or iPod; an iPad that calls itself a Mac is told by its touch
 * points.
 * @param {{ userAgent: string, platform: string, maxTouchPoints: number }} navigatorLike
 * @returns {boolean}
 */
export function isIos({ userAgent, platform, maxTouchPoints }) {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}
