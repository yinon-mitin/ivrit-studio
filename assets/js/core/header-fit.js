// When the header runs short of room, the site name steps aside and the cursive mark stays. Pure, no DOM:
// ui/header-fit.js measures, this decides.

/** Spare room, in px, kept beyond the name's own width before it comes back, so the header does not flip at the edge. */
export const HYSTERESIS = 12;

/**
 * Whether the header should show only the mark.
 * @param {boolean} compact whether it shows only the mark now
 * @param {number} free the room left in the part navigation (negative: it is clipped), in px
 * @param {number} nameWidth how much room the name takes when shown, in px
 * @returns {boolean}
 */
export function nextCompact(compact, free, nameWidth) {
  if (!compact) return free < 0;
  return free < nameWidth + HYSTERESIS;
}
