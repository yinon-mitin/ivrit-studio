// Header fit: when the part navigation (a laptop) or the first row (a phone) is out of room, the site
// name is hidden and only the cursive mark stays (`data-compact` on the header; the name stays for screen
// readers). It comes back once there is room for it with some to spare. Re-measured when the header
// resizes, when the navigation is rebuilt (language, part) and when the fonts have loaded.
import { nextCompact } from '../core/header-fit.js';

/**
 * @param {HTMLElement} header
 * @param {MediaQueryList} wide the laptop layout, where the parts share the header's row
 * @returns {{ fit: () => void }}
 */
export function mountHeaderFit(header, wide) {
  const name = header.querySelector('.brand-name');
  const brand = header.querySelector('.brand');
  /** The room the name takes in the row, measured whenever it is shown. */
  let nameWidth = 0;
  let frame = 0;

  /** Room left in the row, in px: negative when something is clipped or pushed out. */
  const free = () => {
    if (wide.matches) {
      const list = header.querySelector('.part-nav-list');
      if (!list) return Infinity;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const content = [...list.children].reduce((sum, item) => sum + item.offsetWidth, 0) + gap * Math.max(0, list.children.length - 1);
      return list.clientWidth - content;
    }
    // A phone: the parts have their own row; the first row (brand, search, controls) leaves its middle track free.
    const middle = parseFloat(getComputedStyle(header).gridTemplateColumns.split(' ')[1]) || 0;
    return middle - Math.max(0, header.scrollWidth - header.clientWidth);
  };

  const measure = () => {
    frame = 0;
    const compact = header.hasAttribute('data-compact');
    if (!compact) {
      const width = name.getBoundingClientRect().width;
      if (width > 2) nameWidth = width + (parseFloat(getComputedStyle(brand).columnGap) || 0);
    }
    const next = nextCompact(compact, free(), nameWidth);
    if (next !== compact) header.toggleAttribute('data-compact', next);
  };
  const fit = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };

  new ResizeObserver(fit).observe(header);
  new MutationObserver(fit).observe(header, { childList: true, subtree: true });
  wide.addEventListener('change', fit);
  document.fonts?.ready.then(fit);
  fit();
  return { fit };
}
