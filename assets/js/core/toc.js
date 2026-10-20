// Layout of the flowing section titles (after getartcraft.com): passed titles stacked at the top, the
// current one large below them, coming ones stacked up from the bottom. Pure, no DOM.

/**
 * @typedef {{ top: number, bottom: number, line: number, large: number, gap: number }} TocMetrics
 *   top: where the stack starts; bottom: where the upcoming stack ends; line: one small title's height;
 *   large: the current title's height; gap: space around the current title (all px, screen coordinates)
 */

/**
 * Where each title goes and how large it is drawn, for `count` titles with the one at `current` being
 * read. Upcoming titles never overlap the current one: on a short screen they move down instead.
 * @param {number} count
 * @param {number} current
 * @param {TocMetrics} metrics
 * @returns {Array<{ state: 'past' | 'current' | 'upcoming', y: number, scale: number }>}
 */
export function tocLayout(count, current, { top, bottom, line, large, gap }) {
  const currentY = top + current * line + (current > 0 ? gap : 0);
  const below = currentY + large + gap;
  return Array.from({ length: count }, (_, i) => {
    if (i < current) return { state: 'past', y: top + i * line, scale: 1 };
    if (i === current) return { state: 'current', y: currentY, scale: large / line };
    const fromBottom = bottom - (count - i) * line;
    return { state: 'upcoming', y: Math.max(fromBottom, below + (i - current - 1) * line), scale: 1 };
  });
}
