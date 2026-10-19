import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, record, serialize, parse, merge, PROGRESS_VERSION } from '../../assets/js/core/progress.js';

const T1 = '2026-10-19T10:00:00Z';
const T2 = '2026-10-19T11:00:00Z';
const card = (extra = {}) => ({ box: 2, seen: 5, wrong: 1, lastSeen: T1, confusedWith: {}, ...extra });
const progressWith = (cards) => ({ ...emptyProgress(), cards });

describe('record', () => {
  it('moves a new card to box 1 on a correct answer and counts it as seen', () => {
    const next = record(emptyProgress(), 'alphabet.bet|print-to-name', true, T1);
    assert.deepEqual(next.cards['alphabet.bet|print-to-name'], { box: 1, seen: 1, wrong: 0, lastSeen: T1, confusedWith: {} });
  });

  it('moves a card up one box on a correct answer, at most to box 5', () => {
    assert.equal(record(progressWith({ k: card({ box: 2 }) }), 'k', true, T2).cards.k.box, 3);
    assert.equal(record(progressWith({ k: card({ box: 5 }) }), 'k', true, T2).cards.k.box, 5);
  });

  it('sends a card back to box 1 on a wrong answer and counts the mistake', () => {
    const next = record(progressWith({ k: card({ box: 4, wrong: 1 }) }), 'k', false, T2).cards.k;
    assert.deepEqual([next.box, next.seen, next.wrong, next.lastSeen], [1, 6, 2, T2]);
  });

  it('counts what a wrong answer was confused with', () => {
    let p = record(emptyProgress(), 'k', false, T1, 'alphabet.kaf');
    p = record(p, 'k', false, T2, 'alphabet.kaf');
    assert.deepEqual(p.cards.k.confusedWith, { 'alphabet.kaf': 2 });
  });

  it('does not change the progress it is given', () => {
    const before = progressWith({ k: card() });
    const snapshot = JSON.stringify(before);
    record(before, 'k', false, T2, 'x');
    assert.equal(JSON.stringify(before), snapshot);
  });
});

describe('serialize and parse', () => {
  it('round-trips progress and stamps exportedAt', () => {
    const p = progressWith({ k: card() });
    const text = serialize(p, T2);
    assert.equal(JSON.parse(text).exportedAt, T2);
    assert.deepEqual(parse(text), { ok: true, progress: { app: 'ivrit-studio', version: PROGRESS_VERSION, cards: { k: card() } } });
  });

  it('rejects text that is not JSON', () => {
    assert.deepEqual(parse('{ "app": '), { ok: false, error: 'invalid-json' });
  });

  it('rejects a file from another app', () => {
    assert.deepEqual(parse(JSON.stringify({ app: 'other', version: 1, cards: {} })), { ok: false, error: 'not-ivrit-studio' });
    assert.deepEqual(parse('[]'), { ok: false, error: 'not-ivrit-studio' });
  });

  it('rejects a newer version it cannot read', () => {
    assert.deepEqual(parse(JSON.stringify({ app: 'ivrit-studio', version: PROGRESS_VERSION + 1, cards: {} })), { ok: false, error: 'newer-version' });
  });

  it('rejects cards with impossible values', () => {
    for (const bad of [{ k: card({ box: 9 }) }, { k: card({ seen: -1 }) }, { k: card({ lastSeen: 'yesterday' }) }, { k: 'x' }, []]) {
      assert.deepEqual(parse(JSON.stringify({ app: 'ivrit-studio', version: 1, cards: bad })), { ok: false, error: 'invalid-format' }, JSON.stringify(bad));
    }
  });

  it('migrates version 0, whose cards had only box and lastSeen', () => {
    const old = { app: 'ivrit-studio', version: 0, cards: { k: { box: 3, lastSeen: T1 } } };
    assert.deepEqual(parse(JSON.stringify(old)), {
      ok: true, progress: { app: 'ivrit-studio', version: PROGRESS_VERSION, cards: { k: { box: 3, seen: 0, wrong: 0, lastSeen: T1, confusedWith: {} } } },
    });
  });
});

describe('merge', () => {
  it('keeps every card from both sides', () => {
    const merged = merge(progressWith({ a: card() }), progressWith({ b: card() }));
    assert.deepEqual(Object.keys(merged.cards).sort(), ['a', 'b']);
  });

  it('keeps the more recently seen record of a card on either side', () => {
    const older = card({ box: 1, lastSeen: T1 });
    const newer = card({ box: 4, lastSeen: T2 });
    assert.equal(merge(progressWith({ k: older }), progressWith({ k: newer })).cards.k.box, 4);
    assert.equal(merge(progressWith({ k: newer }), progressWith({ k: older })).cards.k.box, 4);
  });

  it('keeps the local record on a tie', () => {
    const merged = merge(progressWith({ k: card({ box: 1 }) }), progressWith({ k: card({ box: 5 }) }));
    assert.equal(merged.cards.k.box, 1);
  });

  it('does not change either side', () => {
    const local = progressWith({ a: card() });
    const incoming = progressWith({ a: card({ lastSeen: T2 }), b: card() });
    const snapshot = JSON.stringify([local, incoming]);
    merge(local, incoming);
    assert.equal(JSON.stringify([local, incoming]), snapshot);
  });
});
