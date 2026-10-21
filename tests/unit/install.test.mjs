import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SNOOZE_MS, ENGAGED_MS, VISIT_GAP_MS,
  defaultInstallState, parseInstallState, recordVisit, dismissOffer, markInstalled, msUntilEngaged, installOffer, isIos,
} from '../../assets/js/core/install.js';

const DAY = 24 * 3600 * 1000;
const NOW = 1_800_000_000_000;
const returning = { ...defaultInstallState(), visits: 2, firstSeen: NOW - DAY, lastSeen: NOW };
const phone = { standalone: false, touch: true, ios: false, canPrompt: true };

describe('parseInstallState', () => {
  it('is the default for missing, broken or non-object values', () => {
    for (const stored of [null, '', 'nope', '[]', '7', 'null']) assert.deepEqual(parseInstallState(stored), defaultInstallState());
  });

  it('keeps valid fields and falls back field by field, dropping unknown ones', () => {
    const state = parseInstallState(JSON.stringify({ visits: 3, firstSeen: 'x', lastSeen: NOW, dismissedAt: -1, installed: 'yes', extra: 1 }));
    assert.deepEqual(state, { ...defaultInstallState(), visits: 3, lastSeen: NOW });
  });

  it('round-trips a state', () => {
    const state = { visits: 2, firstSeen: 5, lastSeen: 9, dismissedAt: 7, installed: true };
    assert.deepEqual(parseInstallState(JSON.stringify(state)), state);
  });
});

describe('recordVisit', () => {
  it('counts the first visit and remembers when it was', () => {
    assert.deepEqual(recordVisit(defaultInstallState(), NOW), { ...defaultInstallState(), visits: 1, firstSeen: NOW, lastSeen: NOW });
  });

  it('does not count a reload or a quick return as a new visit, but does after a gap', () => {
    const first = recordVisit(defaultInstallState(), NOW);
    assert.equal(recordVisit(first, NOW + VISIT_GAP_MS - 1).visits, 1);
    assert.equal(recordVisit(first, NOW + VISIT_GAP_MS).visits, 2);
    assert.equal(recordVisit(first, NOW + VISIT_GAP_MS).firstSeen, NOW);
  });

  it('moves lastSeen on every call, and does not change its input', () => {
    const first = recordVisit(defaultInstallState(), NOW);
    assert.equal(recordVisit(first, NOW + 1000).lastSeen, NOW + 1000);
    assert.equal(first.lastSeen, NOW);
  });
});

describe('dismissOffer and markInstalled', () => {
  it('record the time of the dismissal and the installation without touching the rest', () => {
    assert.deepEqual(dismissOffer(returning, NOW), { ...returning, dismissedAt: NOW });
    assert.deepEqual(markInstalled(returning), { ...returning, installed: true });
  });
});

describe('msUntilEngaged', () => {
  it('is 0 from the second visit', () => {
    assert.equal(msUntilEngaged(returning, NOW), 0);
  });

  it('on the first visit it counts down 30 s from when it was first seen', () => {
    const first = recordVisit(defaultInstallState(), NOW);
    assert.equal(msUntilEngaged(first, NOW), ENGAGED_MS);
    assert.equal(msUntilEngaged(first, NOW + 12_000), ENGAGED_MS - 12_000);
    assert.equal(msUntilEngaged(first, NOW + ENGAGED_MS), 0);
    assert.equal(msUntilEngaged(first, NOW + 5 * ENGAGED_MS), 0);
  });
});

describe('installOffer', () => {
  const offer = (changes = {}, state = returning) => installOffer({ state, now: NOW, ...phone, ...changes });

  it('offers the browser prompt on a returning phone visitor when the browser can prompt', () => {
    assert.equal(offer(), 'prompt');
  });

  it('offers the iOS hint where there is no prompt to give', () => {
    assert.equal(offer({ ios: true, canPrompt: false }), 'ios-hint');
  });

  it('offers nothing where the browser cannot prompt and it is not iOS', () => {
    assert.equal(offer({ canPrompt: false }), 'none');
  });

  it('offers nothing on a first visit before 30 s, and does after', () => {
    const first = recordVisit(defaultInstallState(), NOW);
    assert.equal(offer({}, first), 'none');
    assert.equal(installOffer({ state: first, now: NOW + ENGAGED_MS, ...phone }), 'prompt');
  });

  it('offers nothing in the installed app, on a screen without touch, or once installed', () => {
    assert.equal(offer({ standalone: true }), 'none');
    assert.equal(offer({ touch: false }), 'none');
    assert.equal(offer({}, markInstalled(returning)), 'none');
  });

  it('stays quiet for 30 days after a dismissal, then offers again', () => {
    const dismissed = dismissOffer(returning, NOW);
    assert.equal(installOffer({ state: dismissed, now: NOW + SNOOZE_MS - 1, ...phone }), 'none');
    assert.equal(installOffer({ state: dismissed, now: NOW + SNOOZE_MS, ...phone }), 'prompt');
  });
});

describe('isIos', () => {
  it('knows iPhone, iPad and iPod by their user agent', () => {
    assert.equal(isIos({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', platform: 'iPhone', maxTouchPoints: 5 }), true);
    assert.equal(isIos({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)', platform: 'iPad', maxTouchPoints: 5 }), true);
  });

  it('knows an iPad that calls itself a Mac by its touch points, and a real Mac and an Android phone as not iOS', () => {
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
    assert.equal(isIos({ userAgent: mac, platform: 'MacIntel', maxTouchPoints: 5 }), true);
    assert.equal(isIos({ userAgent: mac, platform: 'MacIntel', maxTouchPoints: 0 }), false);
    assert.equal(isIos({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36', platform: 'Linux armv8l', maxTouchPoints: 5 }), false);
  });
});
