import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTab, itemsForTab, viewOf, withWeeks, latestLetters, weekTabId } from '../../assets/js/core/content.js';

const tabbed = {
  id: 'alphabet',
  view: 'letter-grid',
  tabs: [{ id: 'letters' }, { id: 'rows', view: 'letter-rows' }],
  items: [{ id: 'alphabet.alef', tab: 'letters' }, { id: 'alphabet.vet', tab: 'rows' }, { id: 'alphabet.bet', tab: 'letters' }],
};
const untabbed = { id: 'geresh', view: 'table', items: [{ id: 'geresh.jeans' }, { id: 'geresh.chile' }] };

describe('resolveTab', () => {
  it('returns the tab with the given id', () => {
    assert.equal(resolveTab(tabbed, 'rows').id, 'rows');
  });

  it('defaults to the first tab when no id is given', () => {
    assert.equal(resolveTab(tabbed, undefined).id, 'letters');
  });

  it('falls back to the first tab for an unknown id', () => {
    assert.equal(resolveTab(tabbed, 'nope').id, 'letters');
  });

  it('is null for a section without tabs', () => {
    assert.equal(resolveTab(untabbed, 'anything'), null);
  });
});

describe('itemsForTab', () => {
  it('returns the entries of the tab in data order', () => {
    assert.deepEqual(itemsForTab(tabbed, tabbed.tabs[0]).map((i) => i.id), ['alphabet.alef', 'alphabet.bet']);
  });

  it('returns every entry for a section without tabs', () => {
    assert.deepEqual(itemsForTab(untabbed, null).map((i) => i.id), ['geresh.jeans', 'geresh.chile']);
  });

  it('returns every entry of the section for a letter-rows tab without entries of its own', () => {
    const section = { ...tabbed, tabs: [...tabbed.tabs, { id: 'print-cursive', view: 'letter-rows' }] };
    const ids = itemsForTab(section, section.tabs[2]).map((i) => i.id);
    assert.deepEqual(ids, ['alphabet.alef', 'alphabet.vet', 'alphabet.bet']);
  });

  it('treats a tab that inherits letter-rows from its section the same way', () => {
    const section = { ...untabbed, view: 'letter-rows', tabs: [{ id: 'all' }] };
    assert.deepEqual(itemsForTab(section, section.tabs[0]).map((i) => i.id), ['geresh.jeans', 'geresh.chile']);
  });

  it('returns only its own entries for a letter-rows tab that has some', () => {
    assert.deepEqual(itemsForTab(tabbed, tabbed.tabs[1]).map((i) => i.id), ['alphabet.vet']);
  });

  it('returns nothing for an empty tab of another view', () => {
    const section = { ...tabbed, tabs: [...tabbed.tabs, { id: 'empty' }] };
    assert.deepEqual(itemsForTab(section, section.tabs[2]), []);
  });
});

describe('viewOf', () => {
  it('uses the tab view when the tab has one', () => {
    assert.equal(viewOf(tabbed, tabbed.tabs[1]), 'letter-rows');
  });

  it('uses the section view otherwise', () => {
    assert.equal(viewOf(tabbed, tabbed.tabs[0]), 'letter-grid');
    assert.equal(viewOf(untabbed, null), 'table');
  });
});

const vocab = { id: 'vocab', view: 'card-grid', items: [] };
const word = (slug, extra = {}) => ({ section: 'vocab', id: `vocab.${slug}`, he: 'שָׁלוֹם', ...extra });
const weekOf = (date, items, letters = ['א']) => ({ week: date, letters, items });

describe('weekTabId', () => {
  it('is week-<date>', () => {
    assert.equal(weekTabId('2026-10-11'), 'week-2026-10-11');
  });
});

describe('withWeeks', () => {
  it('adds a week tab and puts the week entries for this section in it, without their section field', () => {
    const merged = withWeeks(vocab, [weekOf('2026-10-11', [word('shalom'), { section: 'colors', id: 'colors.red', he: 'אָדֹם' }])]);
    assert.deepEqual(merged.tabs, [{ id: 'week-2026-10-11', week: '2026-10-11' }]);
    assert.deepEqual(merged.items, [{ tab: 'week-2026-10-11', id: 'vocab.shalom', he: 'שָׁלוֹם' }]);
  });

  it('orders week tabs newest first, after the section tabs, whatever the input order', () => {
    const section = { ...vocab, tabs: [{ id: 'basics' }] };
    const merged = withWeeks(section, [weekOf('2026-10-04', [word('a')]), weekOf('2026-10-18', [word('c')]), weekOf('2026-10-11', [word('b')])]);
    assert.deepEqual(merged.tabs.map((tab) => tab.id), ['basics', 'week-2026-10-18', 'week-2026-10-11', 'week-2026-10-04']);
    assert.deepEqual(merged.items.map((item) => item.id), ['vocab.c', 'vocab.b', 'vocab.a']);
  });

  it('keeps an explicit tab on a week entry and adds no week tab for it', () => {
    const section = { ...vocab, tabs: [{ id: 'basics' }] };
    const merged = withWeeks(section, [weekOf('2026-10-11', [word('a', { tab: 'basics' })])]);
    assert.deepEqual(merged.tabs, [{ id: 'basics' }]);
    assert.equal(merged.items[0].tab, 'basics');
  });

  it('leaves a section untouched by weeks without entries for it', () => {
    assert.deepEqual(withWeeks(vocab, [weekOf('2026-10-11', [])]), vocab);
  });

  it('does not change its inputs', () => {
    const section = { ...vocab, tabs: [{ id: 'basics' }], items: [] };
    const weeks = [weekOf('2026-10-11', [word('a')])];
    const before = JSON.stringify({ section, weeks });
    withWeeks(section, weeks);
    assert.equal(JSON.stringify({ section, weeks }), before);
  });
});

describe('latestLetters', () => {
  it('returns the letters of the most recent week', () => {
    const weeks = [weekOf('2026-10-11', [], ['א', 'ב', 'ג']), weekOf('2026-10-04', [], ['א'])];
    assert.deepEqual(latestLetters(weeks), ['א', 'ב', 'ג']);
  });

  it('is null without weeks', () => {
    assert.equal(latestLetters([]), null);
  });
});
