# Implementation Plan: Ivrit Studio — design fixes (phone header, compact alphabet, two data tweaks, back to top)

Written 2026-10-21, **separate from `tasks/plan.md`, `tasks/plan-next.md` and `tasks/plan-content.md`**, which have open work. Task list: `tasks/todo-design.md`. Numbers continue from 36 (the content plan holds 21–35). Owner on the content plan, same day: «Все подтверждаю» — it is approved and ready for `/build`.

## Overview
Five owner requests (2026-10-21):
1. **Phone header: the site name wraps to two lines** ("Ivrit / Studio") and wastes space.
2. **Phone: Letters and Finals & variants do not fit on one screen** and have to be scrolled; make the table tighter.
3. **Remove "The Hebrew University of Jerusalem"** from Words (the entry only; the word "university" stays).
4. **Merge "EU I" and "EU II"** in Countries.
5. **A quiet "back to top" icon.**

## Findings (measured today with Playwright against the live code)
| Item | Finding |
|---|---|
| Header | The name is hidden (screen-reader only) below 26rem = 416 px, so 360 and 390 px phones are fine. From 417 px (a 430 px iPhone Pro Max, many Android phones in landscape or large) the name is visible and **wraps to two lines: 83 × 53 px**. Header 101 px + page bar 37 px = **138 px, over the SPEC limit of 132 px** — a bug no test covers, because the test viewports are 360, 390 and 1280. |
| Alphabet | At 360×640 the Letters grid is 550 px (4 rows of 134 px, 6 columns) and Finals is 298 px; from the Letters section top to the end of Finals is ~850 px. The space under the sticky header and bar is **526 px** at 360×640 and 550 px at 390×664. |
| Alphabet, compact try | With **9 columns** (22 letters = 3 rows, the **9 finals = exactly 1 row**), glyph line-height ≈ 1.05, padding 3 px, cursive 1.6rem, label 0.62rem, print glyph kept at 2.5rem = 40 px (the SPEC minimum), the two grids come to ~4 rows × ~89 px, roughly 360–440 px with the group titles — it fits. An 8-column try (5 rows) misses by 35–60 px. Needs a spike to check legibility (names like "Samekh" in a 40 px cell, Russian names). |
| Data | `vocab.hebrew-university` is one entry, referenced nowhere else (no test, doc or plan). `eu-1` has 14 entries and `eu-2` 13; group ids appear in unit-test fixtures only, not in tests of the real data. |
| Links | An unknown group in a URL already falls back to its section (`main.js`: group, else section, else top), so old `#/words/countries/eu-1` / `eu-2` links keep landing on Countries. |

## Decisions (defaults in bold; say if you disagree)
1. **Header:** keep the name visible where it fits and **never let it wrap** (`white-space: nowrap`); if it does not fit next to the controls on a width between 417 and ~480 px, hide it from there as well (the cursive mark stays). The check runs at 360, 390, 412, 430 px, in English and Russian.
2. **Alphabet:** **9 columns on phones** (below 40rem), as the data allows the finals to sit in one row; tablet and laptop stay at 8 and 10. The letter-grid cells get tighter line-height, padding and label size on phones only. The print glyph stays ≥ 40 px (SPEC). Fallback if the spike shows it hurts reading at 360 px: fit at 390×664 and larger, and tell the owner with screenshots.
3. **Countries:** one group, id **`eu`**, titled "EU" / «ЕС», 27 entries in the present order (EU I then EU II). Entry ids (`countries.france`…) do not change; only their `group`. Old `eu-1`/`eu-2` links go to the section (covered by a test).
4. **Hebrew University:** delete the entry `vocab.hebrew-university`; `vocab.university` stays.
5. **Back to top:** a **round 40 px icon button (an up-chevron), bottom corner at the reading end**, quiet (outlined, muted, no shadow). It appears after the page has scrolled more than **one screen** and disappears again near the top. It scrolls to the top (smooth, instant under reduced motion) and moves focus to the site name link, so a keyboard user is not left on a button that vanished. On a laptop with the ruler, it sits left of the ruler; on a phone it sits above the install banner when that is shown; not in print. Label «Наверх» / "Back to top" from `i18n.js`.
6. **SPEC:** a new `back-to-top` UI module is outside the capability map (an "ask first" item). Approving this plan counts as that approval; T39 updates SPEC in the same task. The header, alphabet and countries changes also update their SPEC lines.

## Dependency Graph
```
T36 header name stays on one line + header-height e2e at 360/390/412/430
T37 compact alphabet on phones (css + e2e "fits on one screen")        independent
T38 data: remove HUJ entry, merge EU groups (+ old-link fallback test)    independent
T39 back to top
      ├── core/scroll.js: showBackToTop(scrollY, viewportHeight) (pure)
      ├── ui/back-to-top.js (DOM) + i18n + css
      └── placement vs ruler (laptop) and install banner (phone)
```
Nothing depends on anything else. Order by size and risk: T36 (a bug, small) → T38 (data) → T37 (needs the spike) → T39. They do not conflict with the content plan: T38 touches `vocab.json` and `countries.json`, which T21–T35 only read (T33 refers to `vocab.limon`).

## Architecture Decisions
- **The rule that matters is measured, not eyeballed.** T36 adds the missing header test at more phone widths (the SPEC limit exists, the test viewports did not reach it). T37 adds an e2e that scrolls Alphabet to the top of the reading area and checks that the end of the Finals grid is inside the viewport at 360×640 and 390×664.
- **Back to top: the decision is a pure function** (`showBackToTop(scrollY, viewportHeight)` in `core/scroll.js`, unit-tested including the boundary), as `readingLine` was. The DOM file only listens to scroll (passive, one `requestAnimationFrame` batch, no layout reads in the handler other than `scrollY`/`innerHeight`) and toggles `hidden`. No new dependency, no inline script, same CSP.
- **Accessibility:** a real `<button type="button">` with an `aria-label`, visible focus ring like the other controls, ≥ 40 px touch target; hidden with `hidden` so it is not focusable when not shown; contrast checked by the existing axe run in both themes.
- **Performance:** one small module (counted in the `modulepreload` list in `index.html`; `tests/unit/preload.test.mjs` fails if it is forgotten). No effect on LCP/CLS: the button is `position: fixed`.
- **Data changes keep ids.** Only `group` values change; entry ids stay. No migration for the user's saved state (none exists for groups).

## Task List

### Phase 12: Design fixes
- [x] Task 36: The site name never wraps; header ≤ 132 px at every phone width
- [x] Task 37: Compact alphabet: Letters and Finals on one phone screen
- [x] Task 38: Data: remove the Hebrew University entry; merge EU I and EU II
- [ ] Task 39: Quiet "back to top" button

### Checkpoint K: Design fixes
- [ ] `npm run check:full` green
- [ ] Owner looks at screenshots (360, 390, 430 px; alphabet in both languages; the back-to-top button on phone, with the install banner and on a laptop with the ruler) and says what to adjust

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| 9 columns make letter names unreadable at 360 px | Medium | Spike with screenshots first (T37 step 1); a clear fallback (fit at 390 and up) and the owner decides at the checkpoint; the 40 px glyph minimum and the "no horizontal overflow" constraint are not touched |
| The alphabet fix hides the sound/name hierarchy | Low | Only spacing and sizes change on phones; cell content stays |
| Back-to-top button covers content, the install banner or the ruler | Medium | Placement rules above, each with an e2e (bounding boxes do not intersect); hidden at the top and in print |
| Back-to-top focus handling surprises | Low | Focus goes to the brand link only after a click or keyboard activation; a test covers it |
| Old EU links | Low | Existing fallback to the section, now covered by a test |
| e2e time grows | Low | New specs are small; duration noted at Checkpoint K (limit 90 s, then stop and ask) |

## Open Questions
- Should the back-to-top button also appear on the contents page? Default: yes when the page is longer than a screen (it rarely is).
- Corner: bottom-right on a phone (thumb reach) — right-handed bias is accepted; on RTL pages nothing changes because the UI is LTR.
