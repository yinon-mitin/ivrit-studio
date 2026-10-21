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

/**
 * The line that counts as being read, in viewport coordinates: the middle of the viewport when
 * centred (the flowing titles on a laptop), else the line just under the sticky header.
 * @param {number} viewportHeight
 * @param {number} offset the line under the sticky header
 * @param {boolean} centred
 * @returns {number}
 */
export const readingLine = (viewportHeight, offset, centred) => (centred ? viewportHeight / 2 : offset);

/**
 * The anchor being read, by `readingLine`. Centred, the last anchor also counts once the page is
 * scrolled to its end (a short last section would never reach the middle), within 2 px.
 * @template {{ top: number }} A
 * @param {A[]} anchors in page order, `top` in document coordinates
 * @param {{ scrollY: number, offset: number, viewportHeight: number, scrollHeight: number, centred: boolean }} view
 * @returns {A | null}
 */
export function readingAnchor(anchors, { scrollY, offset, viewportHeight, scrollHeight, centred }) {
  const scrolls = scrollHeight > viewportHeight;
  if (centred && scrolls && scrollY + viewportHeight >= scrollHeight - 2) return anchors.at(-1) ?? null;
  return currentAnchor(anchors, scrollY, readingLine(viewportHeight, offset, centred));
}

/**
 * Whether the "back to top" button shows: once the page has scrolled more than one screen.
 * @param {number} scrollY
 * @param {number} viewportHeight
 * @returns {boolean}
 */
export const showBackToTop = (scrollY, viewportHeight) => viewportHeight > 0 && scrollY > viewportHeight;

/** CSS pixels in a CSS millimetre: 96 px per inch, 25.4 mm per inch. */
export const PX_PER_MM = 96 / 25.4;

/**
 * A length in CSS pixels as CSS millimetres, the unit of the ruler.
 * @param {number} px
 * @returns {number}
 */
export const toMillimetres = (px) => px / PX_PER_MM;
