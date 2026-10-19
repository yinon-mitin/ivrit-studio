// Hebrew text helpers: nikud removal and detection. Pure, no DOM.

// Cantillation, vowel points, dagesh, meteg, rafe, shin/sin dots, upper/lower dots, qamats qatan.
// Maqaf (U+05BE), paseq, sof pasuq, geresh and gershayim are kept.
const NIKUD = /[֑-ְ֯-ׇֽֿׁׂׅׄ]/g;
const HEBREW_LETTER = /[א-ת]/;

/**
 * Removes nikud and cantillation. Precomposed presentation forms (e.g. U+FB31) are
 * decomposed first so their marks go too; other text is returned in NFC.
 * @param {string} text
 * @returns {string}
 */
export function stripNikud(text) {
  return text.normalize('NFD').replace(NIKUD, '').normalize('NFC');
}

/**
 * True when the text contains at least one Hebrew letter.
 * @param {string} text
 * @returns {boolean}
 */
export function isHebrew(text) {
  return HEBREW_LETTER.test(text.normalize('NFD'));
}

/**
 * The Hebrew text to show for an entry: `he` with nikud on, otherwise `plain` or the stripped `he`.
 * @param {{ he: string, plain?: string }} entry
 * @param {boolean} nikudOn
 * @returns {string}
 */
export function displayHe(entry, nikudOn) {
  return nikudOn ? entry.he : entry.plain ?? stripNikud(entry.he);
}
