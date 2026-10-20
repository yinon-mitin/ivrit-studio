import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scrollPercent, scrollForPercent, currentAnchor } from '../../assets/js/core/scroll.js';

describe('scrollPercent', () => {
  it('is 0 at the top and 100 at the bottom', () => {
    assert.equal(scrollPercent(0, 3000, 1000), 0);
    assert.equal(scrollPercent(2000, 3000, 1000), 100);
    assert.equal(scrollPercent(500, 3000, 1000), 25);
  });

  it('is 0 for a page that does not scroll', () => {
    assert.equal(scrollPercent(0, 800, 1000), 0);
    assert.equal(scrollPercent(0, 1000, 1000), 0);
  });

  it('clamps overscroll (rubber-banding) to 0–100', () => {
    assert.equal(scrollPercent(-40, 3000, 1000), 0);
    assert.equal(scrollPercent(2100, 3000, 1000), 100);
  });
});

describe('scrollForPercent', () => {
  it('is the scroll position for a percentage, clamped', () => {
    assert.equal(scrollForPercent(50, 3000, 1000), 1000);
    assert.equal(scrollForPercent(-5, 3000, 1000), 0);
    assert.equal(scrollForPercent(120, 3000, 1000), 2000);
  });

  it('is 0 for a page that does not scroll', () => {
    assert.equal(scrollForPercent(70, 800, 1000), 0);
  });

  it('round-trips with scrollPercent', () => {
    for (const percent of [0, 12.5, 50, 99, 100]) {
      assert.equal(scrollPercent(scrollForPercent(percent, 5400, 720), 5400, 720), percent);
    }
  });
});

describe('currentAnchor', () => {
  const anchors = [{ id: 'a', top: 300 }, { id: 'b', top: 900 }, { id: 'c', top: 1500 }];

  it('is the first anchor before the first one reaches the reading line', () => {
    assert.equal(currentAnchor(anchors, 0, 100).id, 'a');
  });

  it('is the last anchor at or above the reading line (scrollY + offset)', () => {
    assert.equal(currentAnchor(anchors, 200, 100).id, 'a');
    assert.equal(currentAnchor(anchors, 799, 100).id, 'a');
    assert.equal(currentAnchor(anchors, 800, 100).id, 'b');
    assert.equal(currentAnchor(anchors, 5000, 100).id, 'c');
  });

  it('is null without anchors', () => {
    assert.equal(currentAnchor([], 500, 100), null);
  });
});
