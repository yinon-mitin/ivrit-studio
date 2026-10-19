// Small DOM builders shared by the views. Text goes in via textContent only (no HTML sinks).

/**
 * @param {string} tag
 * @param {string} className
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * An element holding Hebrew text, marked lang="he" dir="rtl" as SPEC requires.
 * @param {string} tag
 * @param {string} className
 * @param {string} text
 * @returns {HTMLElement}
 */
export function hebrew(tag, className, text) {
  const node = el(tag, className, text);
  node.lang = 'he';
  node.dir = 'rtl';
  return node;
}
