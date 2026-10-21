import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scrollPercent, scrollForPercent, currentAnchor, readingLine, readingAnchor, showBackToTop, toMillimetres, PX_PER_MM } from '../../assets/js/core/scroll.js';

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

describe('toMillimetres', () => {
  it('converts CSS pixels to CSS millimetres (96 px per inch, 25.4 mm per inch)', () => {
    assert.equal(PX_PER_MM, 96 / 25.4);
    assert.equal(toMillimetres(0), 0);
    assert.equal(Math.round(toMillimetres(96)), 25);
    assert.equal(Math.round(toMillimetres(378)), 100);
  });
});

describe('readingLine', () => {
  it('is half the viewport when centred, else the offset under the sticky header', () => {
    assert.equal(readingLine(900, 120, true), 450);
    assert.equal(readingLine(900, 120, false), 120);
  });
});

describe('readingAnchor', () => {
  const anchors = [{ id: 'a', top: 300 }, { id: 'b', top: 1500 }, { id: 'c', top: 3000 }];
  // A 900 px viewport on a 3400 px page: the most it scrolls is 2500.
  const at = (scrollY, centred) => readingAnchor(anchors, { scrollY, offset: 120, viewportHeight: 900, scrollHeight: 3400, centred }).id;

  it('without centring it is the anchor at the line under the header, as currentAnchor says', () => {
    assert.equal(at(1380, false), 'b');
    assert.equal(at(1379, false), 'a');
  });

  it('centred, an anchor counts once its top reaches the middle of the viewport', () => {
    assert.equal(at(1049, true), 'a');
    assert.equal(at(1050, true), 'b');
    assert.equal(at(2000, true), 'b');
  });

  it('centred, the last anchor counts at the end of the page even if its top never reaches the middle', () => {
    // c is at 3000; the page ends at scrollY 2500, where the middle line is 2950, above c. The end
    // counts within 2 px, since scroll positions are fractional.
    assert.equal(at(2497, true), 'b');
    assert.equal(at(2498, true), 'c');
    assert.equal(at(2500, true), 'c');
  });

  it('does not apply the end rule to a page that does not scroll, or when not centred', () => {
    assert.equal(readingAnchor(anchors, { scrollY: 0, offset: 120, viewportHeight: 900, scrollHeight: 900, centred: true }).id, 'a');
    assert.equal(at(2500, false), 'b');
  });

  it('is null without anchors', () => {
    assert.equal(readingAnchor([], { scrollY: 0, offset: 120, viewportHeight: 900, scrollHeight: 3400, centred: true }), null);
  });
});

describe('showBackToTop', () => {
  it('is off at the top and within the first screen', () => {
    assert.equal(showBackToTop(0, 700), false);
    assert.equal(showBackToTop(700, 700), false);
  });

  it('is on once the page has scrolled more than one screen', () => {
    assert.equal(showBackToTop(701, 700), true);
    assert.equal(showBackToTop(5000, 700), true);
  });

  it('is off without a usable viewport height', () => {
    assert.equal(showBackToTop(500, 0), false);
    assert.equal(showBackToTop(500, Number.NaN), false);
  });
});
