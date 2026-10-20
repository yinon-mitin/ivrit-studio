# Ivrit Studio — Reading aids, page navigation, second cursive, more vocabulary — Tasks

Plan and decisions: `tasks/plan.md`. Contract: `SPEC.md`. Quality bar: `CONSTRAINTS.md`.

Every task's Definition of Done: `npm run check:fast` after edits, `npm run check:task` green before each commit, test written before core code, no floor violations (no exception is open: deleting or loosening a test is a real violation now). Data and code go in separate commits. SPEC is updated in the same task when behaviour changes.

---

## Phase 1: Reading aids

### Task 1: Nikud toggle visibly changes the contents page and the header mark
**Description:** On the contents page the section icons (בָ, אֶרֶץ, מִלָּה, שָׁלוֹם, זֹאת…) and the header mark עִבְרִית ignore the Nikud toggle, so pressing it seems to do nothing there. Render them through `displayHe` like entries. A short fade-in of the Hebrew (~400 ms) shows what changed. (Done this way instead of a two-layer crossfade: a setting change re-renders the page, so new elements could not crossfade from the old ones.) No animation under `prefers-reduced-motion`. The alphabet icon keeps its marks only where its section has `nikudToggle: false`.

**Acceptance criteria:**
- [x] With nikud off, every contents icon and the header mark show `stripNikud(text)`, except icons of sections with `nikudToggle: false`. Turning nikud on restores them.
- [x] Hebrew fades in after the change (CSS animation `nikud-in`) and does not animate under `prefers-reduced-motion: reduce`. Screen readers get the text once (icons and mark stay `aria-hidden`; the section titles name them).
- [x] Icons and mark keep `lang="he" dir="rtl"`. No layout shift beyond the glyphs themselves.

**Verification:**
- [x] e2e: toggle on `#/` changes the icons' and the mark's visible text. `animationName` is `nikud-in`, and `none` with reduced motion.
- [x] `npm run check:task` green

**Dependencies:** None
**Files:** `assets/js/ui/contents.js`, `index.html` / `assets/js/main.js` (brand mark), `assets/css/app.css`, `tests/e2e/settings.spec.mjs` or `tests/e2e/navigation.spec.mjs`
**Scope:** S

### Task 2: Sticky page bar: current section, jump list, progress line, Hide toggle
**Description:** Pure `core/scroll.js` (test first): `scrollPercent(scrollY, scrollHeight, viewportHeight)` (0–100, clamped), `currentAnchor(anchors, scrollY, offset)` (the last anchor at or above the reading line, else the first), `scrollForPercent(percent, scrollHeight, viewportHeight)`. On part pages a sticky bar under the header shows "Section · Group" for the current place (it updates while scrolling). Tapping it opens a jump list of the part's sections and groups as links. The Hide toggle moves into the bar, out of `.part-tools`, and a thin progress line runs along its bottom edge. One passive, rAF-throttled scroll listener. Anchor offsets are cached per render and resize.

**Acceptance criteria:**
- [x] Unit: `scrollPercent` (top 0, bottom 100, short page 0, clamping), `currentAnchor` (before first, between, exactly at, after last, empty list), `scrollForPercent` round-trip
- [x] e2e: after scrolling to a group, the bar names its section and group. The Hide toggle stays visible and works after scrolling to the bottom. A jump-list link scrolls to its target and closes the list. Escape closes the list.
- [x] Phone: header + bar ≤ 132 px. Laptop: ≤ 104 px. No horizontal overflow. axe clean with the list open in both themes.
- [x] Section and group anchors clear the header + bar (`scroll-margin-top`). The existing "scrolls to the group" tests still pass.

**Verification:**
- [x] `npm run check:task` green; changed-line coverage ≥ 80%
- [x] Screenshots: phone mid-page in both themes

**Dependencies:** None
**Files:** `assets/js/core/scroll.js` (new), `tests/unit/scroll.test.mjs` (new), `assets/js/ui/page-bar.js` (new), `assets/js/main.js`, `assets/js/ui/settings.js`, `assets/css/app.css`, `tests/e2e/page-bar.spec.mjs` (new), `tests/e2e/hide.spec.mjs` (toggle location; assertions kept), `SPEC.md`
**Scope:** M

## Checkpoint A
- [x] `npm run check:task` green
- [x] Phone + laptop screenshots of `#/words` mid-page with the bar (agent-reviewed; owner at Checkpoint B)

---

## Phase 2: Laptop ruler

### Task 3: Scroll ruler on the right (role=scrollbar) with section markers
**Description:** On screens ≥ 64rem with a part page taller than the viewport, add a fixed 56 px ruler at the right edge, after getartcraft.com: `role="scrollbar"`, `aria-controls="content"`, `aria-orientation="vertical"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow` = scroll % (`core/scroll.js`), `aria-label` "Page position". The CSS draws minor ticks every 2% and major ticks with numbers every 10%. A position marker shows "NN%" in the accent. Each section is a longer tick at its offset, with its title beside the marker when current. Click or drag on the ruler scrolls to that %. While focused, ArrowUp/Down move 5%, PageUp/PageDown 25%, Home/End go to top/bottom. Hidden on phones, in print, and on short pages.

**Acceptance criteria:**
- [x] `aria-valuenow` follows scrolling (0 at top, 100 at bottom, ±1). Clicking at 50% of the ruler's height scrolls to about the middle (±3%). Keys move as specified.
- [x] Section markers sit at their sections' offsets (±1% of the ruler height). The current section's title is shown next to the marker.
- [x] Does not cover content at 1280×720 (content right edge ≤ ruler left edge). Hidden below 64rem and in print. axe clean in both themes.

**Verification:**
- [x] e2e on `chromium-laptop` (projects with width < 1024 assert it is hidden)
- [x] `npm run check:task` green

**Dependencies:** Task 2 (scroll.js, anchor cache)
**Files:** `assets/js/ui/ruler.js` (new), `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/ruler.spec.mjs` (new), `SPEC.md`
**Scope:** M

## Checkpoint B: navigation review
- [ ] `npm run check:task` green
- [ ] Owner reviews bar + ruler (screenshots or `npm run serve`) before Phase 3

---

## Phase 3: Second cursive

### Task 4: Spike — Ktav Yad CLM as the second cursive
**Description:** Research only, no product code. Find the official Culmus source and its license text (GPL-2 with font exception). Confirm it may be redistributed from a public MIT repo, and which notices must ship. Check that it has a glyph for every alphabet entry: 27 letters including finals, and the dagesh and shin/sin variants. Report what happens to the marks. Subset to Hebrew + punctuation and measure woff2 size against the 60 KB limit. Render a comparison sheet (print / Gveret Levin / Ktav Yad) as a screenshot for the owner.

**Acceptance criteria:**
- [x] A short verdict in `tasks/notes/cursive-font.md`: source URL + pinned version, license and required notices, glyph coverage table, woff2 size, screenshot path
- [ ] Owner says go or no-go. On no-go, the alternatives are listed (cursive-only drill, words in cursive) and Task 5 is re-planned.

**Verification:**
- [x] Manual: owner looks at the comparison screenshot

**Dependencies:** None (can run in parallel with Phase 1–2)
**Files:** `tasks/notes/cursive-font.md` (new), `scripts/subset-fonts.sh` (only if go, in Task 5)
**Scope:** S

### Task 5: Two cursive styles in the alphabet (only after "go")
**Description:** Add the font: `scripts/subset-fonts.sh` downloads it at a pinned version and subsets it; the woff2 and the license file are committed; README credits it. `@font-face` uses `font-display: swap` and loads only when used. The `letter-rows` view renders three lines (print, Gveret Levin, Ktav Yad), right to left, with style labels at the line start. Data: the alphabet's "rows" group becomes "Two cursive styles / Два почерка" (title change; the group id stays). SPEC: fonts, view description.

**Acceptance criteria:**
- [ ] Each column shows the same letter three times, stacked and centred (the existing letter-rows e2e is extended, not loosened). The second cursive is drawn in Ktav Yad (`document.fonts.check`).
- [ ] The font is requested only on `#/reading` (not on `#/`). First load ≤ 200 KB. Each woff2 ≤ 60 KB.
- [ ] License file committed. README and SPEC credit it.

**Verification:**
- [ ] `npm run check:task` green; `npm run e2e:webkit`
- [ ] Manual: owner compares with the teacher's handwriting

**Dependencies:** Task 4 = go
**Files:** `scripts/subset-fonts.sh`, `assets/fonts/ktav-yad.woff2`, `assets/fonts/LICENSE-KtavYad.txt`, `assets/css/app.css`, `assets/js/views/letter-rows.js`, `assets/js/core/i18n.js`, `data/sections/alphabet.json`, `tests/e2e/cheatsheet.spec.mjs`, `README.md`, `SPEC.md`
**Scope:** M

---

## Phase 4: Vocabulary

### Task 6: List view: colour swatches and m/f-only forms
**Description:** Code only, test first where pure. Validator: `swatch` must be `#rgb` or `#rrggbb`. The list view draws a swatch as a small round chip before the Hebrew: CSSOM `style.setProperty`, allowed by the CSP. The chip has a 1 px rule border so white and black chips show in both themes, and is `aria-hidden` (the meaning says the colour). The forms table hides a column (singular or plural) when no entry form fills it, so numbers can carry only `ms`/`fs`.

**Acceptance criteria:**
- [x] Unit: the validator rejects `red`, `#12`, `#gggggg` and accepts `#fff`, `#d32f2f`
- [x] e2e (fixture section served in place of data, like the old weeks spec): a swatch entry shows a chip with that background. A forms entry with only `ms`/`fs` shows one column, no "—".
- [x] No horizontal overflow; axe clean in both themes

**Verification:**
- [x] `npm run check:task` green

**Dependencies:** None
**Files:** `assets/js/core/schema.js`, `tests/unit/schema.test.mjs`, `assets/js/views/list.js`, `assets/css/app.css`, `tests/e2e/list-features.spec.mjs` (new), `SPEC.md`
**Scope:** S

### Task 7: Numbers (data)
**Description:** New section `numbers` in the Vocabulary part. Groups: `0–10`, `11–20`, `tens` (30…90), `hundreds` (100…900), `big` (1000, 2000, 3000, 10 000, 100 000, 1 000 000; owner: "100 and above"). Entry: `he` = the feminine (counting) form, `forms.ms`/`forms.fs`, translit of the feminine form, `en`/`ru` as the digit and the word ("3 — three"). Icon: `אַחַת`.

**Acceptance criteria:**
- [x] 0–20, 30…90, 100…900, 1000, 2000, 3000, 10 000, 100 000, 1 000 000 (~43 entries), ids `numbers.n<value>`, all `verified: false`. Hundreds and thousands have no gender: `he` alone, no `forms`.
- [x] Validator passes; the section shows up in contents, search ("7", "шесть", "שבע") and print

**Verification:**
- [x] `node scripts/validate.mjs`; `npm run check:task` green (data-driven e2e cover the new section)

**Dependencies:** Task 6 (m/f-only forms)
**Files:** `data/sections/numbers.json` (new), `data/index.json`
**Scope:** S (data)

### Task 8: Days and time (data)
**Description:** New section `time`. Groups: `days` (Sunday–Saturday, יוֹם רִאשׁוֹן … שַׁבָּת), `months` (January–December, Gregorian, as used in Israel), `when` (today, tomorrow, yesterday, now, morning, noon, evening, night, week, month, year, hour, minute). Icon: `יוֹם`.

**Acceptance criteria:**
- [x] 7 + 12 + ~13 entries, all `verified: false`, transliteration rules from SPEC
- [x] Validator passes; search finds "Tuesday", "вторник", "שלישי"

**Verification:**
- [x] `npm run check:task` green

**Dependencies:** None (list view as is)
**Files:** `data/sections/time.json` (new), `data/index.json`
**Scope:** S (data)

### Task 9: Colours (data)
**Description:** New section `colors`: about 12 colours (red, orange, yellow, green, blue, light blue, purple, pink, brown, black, white, grey). Each has `swatch` and `forms` (ms/fs/mp/fp), with `he` = masculine singular. Icon: `צֶבַע`.

**Acceptance criteria:**
- [ ] ~12 entries with swatches and four forms each, all `verified: false`
- [ ] Chips readable in both themes (white/black have the rule border); validator passes

**Verification:**
- [ ] `npm run check:task` green; screenshot in both themes

**Dependencies:** Task 6
**Files:** `data/sections/colors.json` (new), `data/index.json`
**Scope:** S (data)

### Task 10: Family and people (data)
**Description:** New section `family`. Groups: `family` (mother, father, parents, brother, sister, son and daughter are already in vocab and are not duplicated, grandfather, grandmother, husband, wife, family) and `people` (man, boy, girl, child, friend m/f, neighbour m/f, teacher m/f). Where gender pairs exist, use `forms` or `related` with meanings. Icon: `מִשְׁפָּחָה`.

**Acceptance criteria:**
- [ ] ~20 entries, all `verified: false`, no id or meaning that duplicates `vocab` (checked by a one-off script; the validator already rejects duplicate ids)
- [ ] Validator passes

**Verification:**
- [ ] `npm run check:task` green

**Dependencies:** None
**Files:** `data/sections/family.json` (new), `data/index.json`
**Scope:** S (data)

## Checkpoint C: content review
- [ ] `npm run check:task` green; validator warning count reported
- [ ] Owner skims Numbers, Days and time, Colours, Family (screenshots) and checks nikud with Dicta when they choose; `verified: true` only by the owner

---

## Phase 5: Release

### Task 11: Docs and release
**Description:** README "Using the site" gains the page bar, the ruler, and the second cursive if it shipped. The SPEC Open Questions are updated. `npm run check:full`, then push with the owner's approval and confirm CI and Pages.

**Acceptance criteria:**
- [ ] README and SPEC describe what shipped; no stale mention of the old Hide location
- [ ] `npm run check:full` green; CI green after push; the live site serves the new files

**Verification:**
- [ ] `gh run view` green; `curl` of the live `data/index.json` shows the new sections

**Dependencies:** Tasks 1–10 (Task 5 only if go)
**Files:** `README.md`, `SPEC.md`, `tasks/plan.md`
**Scope:** XS

## Checkpoint D: complete
- [ ] CI green on the release push
- [ ] Owner opens the print PDFs of Reading and Vocabulary (carried over from the redesign)
- [ ] Owner opens the site on a real phone in both themes and both languages (carried over from the redesign)
