// Scroll math for the page bar and the ruler: position as a percentage, and which section or group
// is being read. Pure, no DOM.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * How far down the page is scrolled, 0 at the top to 100 at the bottom; 0 for a page that fits.
 * @param {number} scrollY
 * @param {number} scrollHeight
 * @param {number} viewportHeight
 * @returns {number}
 */
export function scrollPercent(scrollY, scrollHeight, viewportHeight) {
  const max = scrollHeight - viewportHeight;
  return max <= 0 ? 0 : clamp((scrollY / max) * 100, 0, 100);
}

/**
 * The scroll position for a percentage (clamped to 0–100); the inverse of scrollPercent.
 * @param {number} percent
 * @param {number} scrollHeight
 * @param {number} viewportHeight
 * @returns {number}
 */
export function scrollForPercent(percent, scrollHeight, viewportHeight) {
  return (clamp(percent, 0, 100) / 100) * Math.max(0, scrollHeight - viewportHeight);
}

/**
 * The anchor being read: the last one whose top is at or above the reading line (scrollY + offset,
 * just under the sticky header), else the first; null without anchors.
 * @template {{ top: number }} A
 * @param {A[]} anchors in page order, `top` in document coordinates
 * @param {number} scrollY
 * @param {number} offset
 * @returns {A | null}
 */
export function currentAnchor(anchors, scrollY, offset) {
  const line = scrollY + offset;
  let current = anchors[0] ?? null;
  for (const anchor of anchors) {
    if (anchor.top > line) break;
    current = anchor;
  }
  return current;
}
