// Hide-translations mode (SPEC): a hidden value is a button that shows it. The button's accessible
// name says what it does; its content stays blurred (CSS) until it is pressed.
import { t } from '../core/i18n.js';
import { el } from './dom.js';

/**
 * Wraps the nodes of a hidden value in a reveal button; a click, Enter or Space shows them.
 * @param {Array<Node | string>} nodes
 * @param {'en' | 'ru'} lang
 * @param {(revealed: boolean) => void} [onReveal] also told when it is shown, e.g. to show related text
 * @returns {HTMLButtonElement}
 */
export function revealButton(nodes, lang, onReveal) {
  const button = /** @type {HTMLButtonElement} */ (el('button', 'reveal'));
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', t('reveal', lang));
  button.append(...nodes);
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', 'true');
    button.removeAttribute('aria-label');
    onReveal?.(true);
  });
  return button;
}
