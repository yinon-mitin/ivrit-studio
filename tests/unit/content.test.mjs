import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sectionGroups, groupAnchor } from '../../assets/js/core/content.js';

const grouped = {
  id: 'alphabet',
  view: 'letter-grid',
  groups: [{ id: 'letters', title: { en: 'Letters' } }, { id: 'rows', view: 'letter-rows' }],
  items: [{ id: 'alphabet.alef', group: 'letters' }, { id: 'alphabet.vet', group: 'rows' }, { id: 'alphabet.bet', group: 'letters' }],
};
const ungrouped = { id: 'geresh', view: 'table', items: [{ id: 'geresh.jeans' }, { id: 'geresh.chile' }] };
const ids = (group) => group.items.map((item) => item.id);

describe('sectionGroups', () => {
  it('returns one untitled group with every entry for a section without groups', () => {
    const groups = sectionGroups(ungrouped);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, null);
    assert.equal(groups[0].view, 'table');
    assert.deepEqual(ids(groups[0]), ['geresh.jeans', 'geresh.chile']);
  });

  it('returns the groups in data order, each with its title and its entries in data order', () => {
    const groups = sectionGroups(grouped);
    assert.deepEqual(groups.map((g) => g.id), ['letters', 'rows']);
    assert.deepEqual(groups[0].title, { en: 'Letters' });
    assert.deepEqual(ids(groups[0]), ['alphabet.alef', 'alphabet.bet']);
  });

  it('uses the group view over the section view', () => {
    assert.deepEqual(sectionGroups(grouped).map((g) => g.view), ['letter-grid', 'letter-rows']);
  });

  it('returns only its own entries for a letter-rows group that has some', () => {
    assert.deepEqual(ids(sectionGroups(grouped)[1]), ['alphabet.vet']);
  });

  it('gives a letter-rows group without entries of its own every entry of the section', () => {
    const section = { ...grouped, groups: [...grouped.groups, { id: 'print-cursive', view: 'letter-rows' }] };
    assert.deepEqual(ids(sectionGroups(section)[2]), ['alphabet.alef', 'alphabet.vet', 'alphabet.bet']);
  });

  it('treats a group that inherits letter-rows from its section the same way', () => {
    const section = { ...ungrouped, view: 'letter-rows', groups: [{ id: 'all' }] };
    assert.deepEqual(ids(sectionGroups(section)[0]), ['geresh.jeans', 'geresh.chile']);
  });

  it('returns no entries for an empty group of another view', () => {
    const section = { ...grouped, groups: [...grouped.groups, { id: 'empty' }] };
    assert.deepEqual(sectionGroups(section)[2].items, []);
  });
});

describe('groupAnchor', () => {
  it('is <section>-<group>, the id of the group on the page', () => {
    assert.equal(groupAnchor('countries', 'eu-1'), 'countries-eu-1');
  });
});
