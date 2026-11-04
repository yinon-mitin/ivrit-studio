import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Every verb in the Verbs section shows its infinitive, and that infinitive is an entry of the Infinitives
// section with the same Hebrew and meaning (the two sections must not drift apart).
const read = (name) => JSON.parse(readFileSync(new URL(`../../data/sections/${name}.json`, import.meta.url), 'utf8'));
const verbs = read('verbs').items.filter((item) => item.group !== 'sentences' && item.forms);
const infinitives = new Map(read('infinitives').items.map((item) => [item.he, item]));

describe('verbs and their infinitives', () => {
  it('there are verbs to check', () => {
    assert.ok(verbs.length >= 20);
  });

  for (const verb of verbs) {
    it(`${verb.id} shows an infinitive that the Infinitives section has`, () => {
      const forms = new Set(Object.values(verb.forms));
      const shown = (verb.related ?? []).filter((word) => !forms.has(word.he));
      assert.equal(shown.length, 1, 'exactly one related word that is not one of the forms');
      const entry = infinitives.get(shown[0].he);
      assert.ok(entry, `${shown[0].he} is in infinitives`);
      assert.equal(shown[0].en, entry.en);
      assert.equal(shown[0].ru, entry.ru);
      assert.equal(shown[0].plain, entry.plain);
    });
  }
});
