import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextCompact, HYSTERESIS } from '../../assets/js/core/header-fit.js';

describe('nextCompact', () => {
  it('with the name shown, goes compact as soon as the navigation is clipped', () => {
    assert.equal(nextCompact(false, -1, 120), true);
    assert.equal(nextCompact(false, 0, 120), false);
    assert.equal(nextCompact(false, 300, 120), false);
  });

  it('compact, brings the name back only with its width and the hysteresis to spare', () => {
    assert.equal(nextCompact(true, 120 + HYSTERESIS - 1, 120), true);
    assert.equal(nextCompact(true, 120 + HYSTERESIS, 120), false);
    assert.equal(nextCompact(true, -50, 120), true);
  });

  it('does not flip back and forth at the edge: after hiding the name there is no room to show it again', () => {
    // 10 px short with the name shown (free -10); hiding it frees its 120 px, so free becomes 110: still compact.
    assert.equal(nextCompact(false, -10, 120), true);
    assert.equal(nextCompact(true, -10 + 120, 120), true);
  });
});
