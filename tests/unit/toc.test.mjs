import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tocLayout } from '../../assets/js/core/toc.js';

const metrics = { top: 120, bottom: 700, line: 24, large: 48, gap: 8 };
const states = (layout) => layout.map((item) => item.state);

describe('tocLayout', () => {
  it('marks titles before the current one past, the current one current, the rest upcoming', () => {
    assert.deepEqual(states(tocLayout(4, 1, metrics)), ['past', 'current', 'upcoming', 'upcoming']);
    assert.deepEqual(states(tocLayout(3, 0, metrics)), ['current', 'upcoming', 'upcoming']);
    assert.deepEqual(states(tocLayout(3, 2, metrics)), ['past', 'past', 'current']);
  });

  it('stacks past titles from the top, then the current one large, and upcoming titles up from the bottom', () => {
    const layout = tocLayout(5, 2, metrics);
    assert.deepEqual(layout.map((item) => item.y), [120, 144, 168 + 8, 700 - 48, 700 - 24]);
    assert.equal(layout[2].scale, 2);
    for (const i of [0, 1, 3, 4]) assert.equal(layout[i].scale, 1);
  });

  it('never overlaps, for up to 8 titles at any position', () => {
    for (let count = 1; count <= 8; count += 1) {
      for (let current = 0; current < count; current += 1) {
        const boxes = tocLayout(count, current, metrics)
          .map((item) => [item.y, item.y + (item.state === 'current' ? metrics.large : metrics.line)])
          .sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < boxes.length; i += 1) assert.ok(boxes[i][0] >= boxes[i - 1][1], `${count}/${current}`);
      }
    }
  });

  it('pushes upcoming titles down below the current one when the screen is short', () => {
    const short = { ...metrics, bottom: 300 };
    const layout = tocLayout(8, 6, short);
    const current = layout[6];
    assert.ok(layout[7].y >= current.y + short.large);
  });

  it('is empty without titles', () => {
    assert.deepEqual(tocLayout(0, 0, metrics), []);
  });
});
