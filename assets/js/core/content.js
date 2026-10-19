// Section content selection: which tab is shown, its entries and its view. Pure, no DOM.

/**
 * The tab to show: the one with `tabId`, else the first. Null for a section without tabs.
 * @param {{ tabs?: Array<{ id: string, view?: string }> }} section
 * @param {string | undefined} tabId
 * @returns {{ id: string, view?: string } | null}
 */
export function resolveTab(section, tabId) {
  const tabs = section.tabs ?? [];
  return tabs.find((tab) => tab.id === tabId) ?? tabs[0] ?? null;
}

/**
 * The entries shown in a tab, in data order. Every entry of the section when it has no tabs, or for a
 * `letter-rows` tab without entries of its own (the alphabet's "print over cursive" tab).
 * @param {{ view: string, items: Array<{ tab?: string }> }} section
 * @param {{ id: string, view?: string } | null} tab
 */
export function itemsForTab(section, tab) {
  if (tab === null) return section.items;
  const own = section.items.filter((item) => item.tab === tab.id);
  return own.length === 0 && viewOf(section, tab) === 'letter-rows' ? section.items : own;
}

/**
 * The view that renders a tab: the tab's own, else the section's.
 * @param {{ view: string }} section
 * @param {{ view?: string } | null} tab
 * @returns {string}
 */
export function viewOf(section, tab) {
  return tab?.view ?? section.view;
}

/**
 * The id of the tab that holds a week's entries.
 * @param {string} date YYYY-MM-DD
 * @returns {string}
 */
export const weekTabId = (date) => `week-${date}`;

const newestFirst = (weeks) => [...weeks].sort((a, b) => b.week.localeCompare(a.week));

/**
 * The section with every week's entries for it added (SPEC Week). Entries without a tab go to an
 * automatic week tab `{ id: 'week-<date>', week }`; week tabs follow the section's own tabs, newest
 * first, so the current week opens by default in a section made of weeks. Inputs are not changed.
 * @param {{ id: string, tabs?: Array<{ id: string }>, items: Array<object> }} section
 * @param {Array<{ week: string, items: Array<{ section: string, tab?: string }> }>} weeks
 */
export function withWeeks(section, weeks) {
  const tabs = [...(section.tabs ?? [])];
  const items = [...section.items];
  for (const week of newestFirst(weeks)) {
    const own = week.items.filter((item) => item.section === section.id);
    const tabId = weekTabId(week.week);
    if (own.some((item) => item.tab === undefined)) tabs.push({ id: tabId, week: week.week });
    for (const { section: _section, ...item } of own) items.push({ tab: tabId, ...item });
  }
  return tabs.length > 0 ? { ...section, tabs, items } : { ...section, items };
}

/**
 * The letters covered so far: those of the most recent week, or null when there are no weeks.
 * @param {Array<{ week: string, letters: string[] }>} weeks
 * @returns {string[] | null}
 */
export function latestLetters(weeks) {
  return newestFirst(weeks)[0]?.letters ?? null;
}
