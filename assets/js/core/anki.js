// Anki export (SPEC Anki): a section as UTF-8 TSV with Anki's file headers. Pure, no DOM.

const HEADERS = ['#separator:tab', '#html:false', '#tags column:3'];

/** Tabs and line breaks would split a field; they become spaces. */
const field = (text) => String(text).replace(/[\t\r\n]+/g, ' ');

/**
 * One row per entry: front = Hebrew, back = "translit — en / ru", tags = ivrit::<section> plus
 * ivrit::<tab> when the entry has one (week tabs included).
 * @param {{ id: string, items: Array<{ he: string, translit: string, en: string, ru: string, tab?: string }> }} section
 *   with its weeks merged in
 * @returns {string}
 */
export function toTsv(section) {
  const rows = section.items.map((item) => {
    const tags = [`ivrit::${section.id}`, ...(item.tab ? [`ivrit::${item.tab}`] : [])].join(' ');
    return [field(item.he), field(`${item.translit} — ${item.en} / ${item.ru}`), tags].join('\t');
  });
  return `${[...HEADERS, ...rows].join('\n')}\n`;
}

/**
 * @param {{ id: string }} section
 * @returns {string}
 */
export const ankiFileName = (section) => `ivrit-${section.id}.tsv`;
