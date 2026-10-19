import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTab, itemsForTab, viewOf } from '../../assets/js/core/content.js';

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
