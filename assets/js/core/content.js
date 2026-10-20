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
