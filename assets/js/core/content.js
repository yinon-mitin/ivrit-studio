// Section content: the groups a section shows on its page, with their entries and views. Pure, no DOM.

/** @typedef {{ id: string | null, title?: { en: string, ru: string }, view: string, items: Array<object> }} Group */

/**
 * The groups of a section in data order, each with its view (the group's own, else the section's) and
 * its entries in data order. A section without groups is one untitled group (id null) with every entry.
 * A `letter-rows` group without entries of its own shows every entry of the section (the alphabet's
 * "print over cursive" group).
 * @param {{ view: string, groups?: Array<{ id: string, title?: object, view?: string }>, items: Array<{ group?: string }> }} section
 * @returns {Group[]}
 */
export function sectionGroups(section) {
  const groups = section.groups ?? [];
  if (groups.length === 0) return [{ id: null, view: section.view, items: section.items }];
  return groups.map((group) => {
    const view = group.view ?? section.view;
    const own = section.items.filter((item) => item.group === group.id);
    return { id: group.id, title: group.title, view, items: own.length === 0 && view === 'letter-rows' ? section.items : own };
  });
}

/**
 * The element id of a group on its page, the target of `#/<section>/<group>`.
 * @param {string} sectionId
 * @param {string} groupId
 * @returns {string}
 */
export const groupAnchor = (sectionId, groupId) => `${sectionId}-${groupId}`;

/** @typedef {{ id: string, title: { en: string, ru: string }, sections: string[] }} Part */

/**
 * The part whose page holds a section.
 * @param {{ parts: Part[] }} index
 * @param {string} sectionId
 * @returns {Part | undefined}
 */
export const partOf = (index, sectionId) => index.parts.find((part) => part.sections.includes(sectionId));

/**
 * The screen for a hash (SPEC Routing): `#/` the contents, `#/<part>[/<section>[/<group>]]` a part page
 * scrolled to the section or group. Old `#/<section>[/<group>]` links open the section in its part.
 * Anything else opens the contents.
 * @param {string} hash
 * @param {{ parts: Part[] }} index
 * @returns {{ name: 'contents' } | { name: 'part', part: string, section: string | null, group: string | null }}
 */
export function resolveRoute(hash, index) {
  let segments;
  try {
    segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return { name: 'contents' };
  }
  const [first, second, third] = segments;
  const part = index.parts.find((p) => p.id === first);
  if (part) {
    const section = part.sections.includes(second) ? second : null;
    return { name: 'part', part: part.id, section, group: section && third ? third : null };
  }
  const home = partOf(index, first);
  if (home && segments.length <= 2) return { name: 'part', part: home.id, section: first, group: second ?? null };
  return { name: 'contents' };
}
