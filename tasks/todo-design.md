# Todo: design fixes

Plan: `tasks/plan-design.md`. Separate from `tasks/todo.md`, `tasks/todo-next.md` and `tasks/todo-content.md`. Numbering continues from 36.

## Phase 12: Design fixes

### Task 36: The site name never wraps; header ≤ 132 px at every phone width
**Description:** From 417 px the name "Ivrit Studio" shows and wraps to two lines, so header + page bar is 138 px (SPEC: ≤ 132 px on a phone). Keep it on one line, and hide it earlier if it cannot fit with the controls.
**Acceptance criteria:**
- [x] At 360, 390, 412 and 430 px wide, in English and Russian, `.brand-name` is one line (height equals its line height) or hidden, and header + page bar ≤ 132 px.
- [x] No horizontal overflow at any of those widths; search, settings and the four controls still fit on the first row.
- [x] SPEC's header sentence names the rule (the name never wraps).
**Verification:**
- [x] Failing test first: a new spec (or a block in `shell.spec.mjs`) that sets `page.setViewportSize` to 412 and 430 and fails on today's code (it measures 138 px at 430).
- [x] `npm run check:task` green (268 e2e). Outcome: the name hides up to 32rem (512 px), because in Russian it does not fit next to the controls at 417–480 px; new spec `header-widths.spec.mjs` at 9 widths.
**Dependencies:** None. **Files:** `assets/css/app.css`, `tests/e2e/shell.spec.mjs`, `SPEC.md`. **Scope:** Small.

### Task 37: Compact alphabet: Letters and Finals on one phone screen
**Description:** On phones the alphabet takes ~850 px (cells are 134 px high, 6 per row). Make the cells tighter and use 9 columns on phones so the 22 letters take 3 rows and the 9 finals exactly 1.
**Steps:** (1) a CSS spike with screenshots at 360 and 390, English and Russian, to confirm legibility; (2) the e2e; (3) the real CSS.
**Acceptance criteria:**
- [ ] With the Alphabet section scrolled to the top of the reading area, the end of the Finals & variants grid is inside the viewport at 360×640 and 390×664 (en and ru).
- [ ] The print glyph stays ≥ 40 px (the SPEC rule is checked by the existing quality spec); names and sounds are not clipped; no horizontal overflow.
- [ ] Tablet (8 columns) and laptop (10 columns) layouts are unchanged; print layout unchanged.
- [ ] SPEC says how many columns a phone shows.
**Verification:**
- [ ] The new e2e fails on today's CSS and passes after.
- [ ] `npm run check:task` green; `npm run e2e:webkit` green (iPhone project); screenshots in both languages and both themes.
- [ ] If it cannot fit at 360×640 without breaking the 40 px rule or clipping, stop and show the owner the 390×664 result and the alternatives.
**Dependencies:** None. **Files:** `assets/css/app.css`, new `tests/e2e/alphabet-fit.spec.mjs`, `SPEC.md`. **Scope:** Small–Medium.

### Task 38: Data: remove the Hebrew University entry; merge EU I and EU II
**Description:** Delete `vocab.hebrew-university`. In `countries.json` replace the groups `eu-1` and `eu-2` by one group `eu` ("EU" / «ЕС»); the 27 entries keep their ids and order, only `group` changes.
**Acceptance criteria:**
- [x] `vocab.json` has 22 entries; `vocab.university` is still there; nothing in the repo refers to the removed id.
- [x] `countries.json` has five groups (`eu`, `europe-other`, `asia`, `americas`, `mideast-africa-oceania`); `eu` holds 27 entries.
- [x] `#/words/countries/eu-1` and `#/words/countries/eu-2` show the Countries section (the page is scrolled to it, not to the top).
- [x] The page-bar group list and the contents page show the new group without code changes.
**Verification:**
- [x] A test for the old links first (it passes already if the fallback holds; it documents the promise).
- [x] `node scripts/validate.mjs`, `npm run check:task` green.
**Dependencies:** None. **Files:** `data/sections/vocab.json`, `data/sections/countries.json`, `tests/e2e/navigation.spec.mjs`. **Scope:** Small.

### Task 39: Quiet "back to top" button
**Description:** A round icon button that scrolls to the top of the page. Shown only after a screen of scrolling.
**Acceptance criteria:**
- [ ] `core/scroll.js` has a pure `showBackToTop(scrollY, viewportHeight)` (true when scrolled more than one viewport height); unit tests cover below, at and above the boundary and a zero-height viewport.
- [ ] A `<button>` with an accessible name «Наверх» / "Back to top" (both languages in `i18n.js`) is hidden at the top and shown after a screen of scrolling; a click scrolls to the top (instant under `prefers-reduced-motion`) and moves focus to the site name link; the keyboard (Enter, Space) works.
- [ ] 40 px target, muted outline, visible focus ring, readable in light and dark (axe clean in both themes).
- [ ] Laptop with the ruler: the button does not overlap the ruler or the flowing titles. Phone with the install banner on screen: it does not overlap the banner. Not in print.
- [ ] No horizontal overflow at the three test viewports; first load ≤ 200 KB; the new module is in the `modulepreload` list.
- [ ] SPEC: capability map row and a sentence in "Раскладка"; structure lines updated.
**Verification:**
- [ ] Unit tests first (RED), then the e2e: hidden at load; appears after a long scroll; click returns `scrollY` to 0 and focus to the brand link; boxes do not intersect the ruler / install banner.
- [ ] `npm run check:task` green; `npm run e2e:webkit` green; screenshots on phone and laptop.
**Dependencies:** None. **Files:** `assets/js/core/scroll.js`, `assets/js/ui/back-to-top.js`, `assets/js/main.js`, `assets/js/core/i18n.js`, `assets/css/app.css`, `index.html` (modulepreload), `tests/unit/scroll.test.mjs`, `tests/e2e/back-to-top.spec.mjs`, `SPEC.md`. **Scope:** Medium (touches 9 files, each change small; if it grows, split the placement rules into their own task).

### Checkpoint K: Design fixes
- [ ] `npm run check:full` green; CI green on the push
- [ ] Owner looks at the screenshots (360, 390, 430 px; alphabet in both languages; the button on phone, with the install banner, and on a laptop with the ruler) and says what to adjust
