import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fieldValue, cardKeys, buildSession, distractors, WEIGHTS, SESSION_SIZE, MAX_NEW } from '../../assets/js/core/blitz.js';
import { emptyProgress } from '../../assets/js/core/progress.js';

/** Deterministic RNG (LCG) for repeatable tests. */
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const letter = (slug, he, tab = 'letters', extra = {}) => ({ id: `alphabet.${slug}`, he, translit: slug[0], en: slug, ru: slug, tab, ...extra });
const alphabet = {
  id: 'alphabet',
  tabs: [{ id: 'letters' }, { id: 'variants' }],
  blitz: [{ id: 'print-to-name', ask: 'he', answer: 'meaning' }],
  confusables: [['alphabet.he', 'alphabet.het', 'alphabet.tav']],
  items: [
    letter('alef', 'א'), letter('bet', 'בּ'), letter('gimel', 'ג'), letter('he', 'ה'), letter('het', 'ח'), letter('tav', 'ת'),
    letter('dalet', 'ד'), letter('resh', 'ר'), letter('vet', 'ב', 'variants'), letter('khaf', 'כ', 'variants'),
  ],
};
const seen = (box) => ({ box, seen: 3, wrong: 0, lastSeen: '2026-10-19T10:00:00Z', confusedWith: {} });
const progressWith = (cards) => ({ ...emptyProgress(), cards });

describe('fieldValue', () => {
  const entry = {
    id: 'x.y', he: 'צָרְפַת', translit: 'Tzarfat', en: 'France', ru: 'Франция', emoji: '🇫🇷',
    related: [{ he: 'צָרְפָתִית' }, { he: 'גֶּרְמָנִית' }], forms: { ms: 'גָּר', mp: 'גָּרִים' },
  };

  it('reads every SPEC field', () => {
    assert.equal(fieldValue(entry, 'he'), 'צָרְפַת');
    assert.equal(fieldValue(entry, 'heCursive'), 'צָרְפַת');
    assert.equal(fieldValue(entry, 'translit'), 'Tzarfat');
    assert.equal(fieldValue(entry, 'emoji'), '🇫🇷');
    assert.equal(fieldValue(entry, 'related.he'), 'צָרְפָתִית, גֶּרְמָנִית');
    assert.equal(fieldValue(entry, 'forms.mp'), 'גָּרִים');
  });

  it('gives the meaning in English, with Russian when shown', () => {
    assert.equal(fieldValue(entry, 'meaning'), 'France');
    assert.equal(fieldValue(entry, 'meaning', { showRu: true }), 'France / Франция');
  });

  it('is undefined for a field the entry does not have', () => {
    const bare = { id: 'x.z', he: 'א', translit: 'a', en: 'a', ru: 'a' };
    for (const field of ['emoji', 'related.he', 'forms.fp']) assert.equal(fieldValue(bare, field), undefined, field);
  });
});

describe('cardKeys', () => {
  it('makes "<itemId>|<templateId>" for each entry that has both fields of a template', () => {
    const section = { ...alphabet, items: alphabet.items.slice(0, 2), blitz: [...alphabet.blitz, { id: 'flag', ask: 'emoji', answer: 'he' }] };
    assert.deepEqual(cardKeys(section), ['alphabet.alef|print-to-name', 'alphabet.bet|print-to-name']);
  });

  it('keeps only letters covered so far when letters are given (dagesh and dots ignored)', () => {
    const keys = cardKeys(alphabet, ['א', 'ב']);
    assert.deepEqual(keys, ['alphabet.alef|print-to-name', 'alphabet.bet|print-to-name', 'alphabet.vet|print-to-name']);
  });
});

describe('buildSession', () => {
  it('has SESSION_SIZE questions, at most MAX_NEW of them new cards, never the same card twice in a row', () => {
    const session = buildSession(alphabet, emptyProgress(), seeded(1));
    assert.equal(session.length, SESSION_SIZE);
    assert.ok(new Set(session.map((q) => q.key)).size <= MAX_NEW);
    for (let i = 1; i < session.length; i += 1) assert.notEqual(session[i].key, session[i - 1].key);
  });

  it('gives each question its entry and template', () => {
    const [question] = buildSession(alphabet, emptyProgress(), seeded(2));
    assert.equal(question.key, `${question.entry.id}|${question.template.id}`);
  });

  it('mixes seen cards with up to MAX_NEW new ones', () => {
    const cards = Object.fromEntries(alphabet.items.slice(0, 4).map((i) => [`${i.id}|print-to-name`, seen(2)]));
    const keys = new Set(buildSession(alphabet, progressWith(cards), seeded(3)).map((q) => q.key));
    const fresh = [...keys].filter((key) => !(key in cards));
    assert.ok(fresh.length <= MAX_NEW);
  });

  it('asks box-1 cards far more often than box-5 cards (weights 16 vs 1)', () => {
    const [weak, strong] = ['alphabet.alef|print-to-name', 'alphabet.bet|print-to-name'];
    const section = { ...alphabet, items: alphabet.items.slice(0, 3) };
    const progress = progressWith({ [weak]: seen(1), [strong]: seen(5), 'alphabet.gimel|print-to-name': seen(3) });
    const rng = seeded(4);
    const counts = { [weak]: 0, [strong]: 0 };
    for (let i = 0; i < 200; i += 1) for (const q of buildSession(section, progress, rng)) if (q.key in counts) counts[q.key] += 1;
    assert.ok(counts[weak] > counts[strong] * 4, JSON.stringify(counts));
    assert.equal(WEIGHTS[1] / WEIGHTS[5], 16);
  });

  it('is empty when the section has no playable cards', () => {
    assert.deepEqual(buildSession({ ...alphabet, blitz: [] }, emptyProgress(), seeded(5)), []);
  });

  it('repeats the only card when there is just one', () => {
    const session = buildSession({ ...alphabet, items: alphabet.items.slice(0, 1) }, emptyProgress(), seeded(6));
    assert.equal(session.length, SESSION_SIZE);
  });
});

describe('distractors', () => {
  const template = alphabet.blitz[0];
  const he = alphabet.items.find((i) => i.id === 'alphabet.he');
  const answers = (list) => list.map((e) => e.id);

  it('returns three other entries with distinct answers, never the correct one', () => {
    const list = distractors(he, template, alphabet, emptyProgress(), seeded(7));
    assert.equal(list.length, 3);
    assert.ok(!answers(list).includes('alphabet.he'));
    assert.equal(new Set(list.map((e) => fieldValue(e, 'meaning'))).size, 3);
  });

  it('uses the confusable group first', () => {
    const list = distractors(he, template, alphabet, emptyProgress(), seeded(8));
    assert.deepEqual(answers(list).slice(0, 2).sort(), ['alphabet.het', 'alphabet.tav']);
  });

  it('puts personal confusions before the confusable group, most frequent first', () => {
    const progress = progressWith({ 'alphabet.he|print-to-name': { ...seen(1), confusedWith: { 'alphabet.dalet': 1, 'alphabet.resh': 3 } } });
    const list = distractors(he, template, alphabet, progress, seeded(9));
    assert.deepEqual(answers(list).slice(0, 2), ['alphabet.resh', 'alphabet.dalet']);
  });

  it('prefers the same tab before the rest of the section', () => {
    const vet = alphabet.items.find((i) => i.id === 'alphabet.vet');
    const list = distractors(vet, template, { ...alphabet, confusables: [] }, emptyProgress(), seeded(10));
    assert.equal(list[0].id, 'alphabet.khaf');
  });

  it('skips entries whose answer looks the same as the correct one', () => {
    const twin = letter('twin', 'ש', 'letters', { en: 'he' });
    const section = { ...alphabet, items: [...alphabet.items, twin] };
    const list = distractors(he, template, section, emptyProgress(), seeded(11));
    assert.ok(!answers(list).includes('alphabet.twin'));
  });

  it('returns fewer than three when the section has too few distinct answers', () => {
    const tiny = { ...alphabet, confusables: [], items: alphabet.items.slice(0, 2) };
    assert.equal(distractors(tiny.items[0], template, tiny, emptyProgress(), seeded(12)).length, 1);
  });
});
