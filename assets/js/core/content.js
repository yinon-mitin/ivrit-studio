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
 * The entries shown in a tab, in data order; every entry when the section has no tabs.
 * @param {{ items: Array<{ tab?: string }> }} section
 * @param {{ id: string } | null} tab
 */
export function itemsForTab(section, tab) {
  return tab === null ? section.items : section.items.filter((item) => item.tab === tab.id);
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
