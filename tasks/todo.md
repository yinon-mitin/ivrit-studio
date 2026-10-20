# Ivrit Studio Cheatsheet Redesign — Tasks

Plan and decisions: `tasks/plan.md`. Contract: `SPEC.md` (rewritten in Task 1). Quality bar: `CONSTRAINTS.md`.

Every task's Definition of Done: `npm run check:fast` after edits, `npm run check:task` green before each commit (Phase 1: green except the floor-guard findings listed in E1), test written before core code, no floor violations outside E1. Data and code go in separate commits.

---

## Phase 1: New contract and removal

### Task 1: Rewrite SPEC.md and CONSTRAINTS.md for the cheatsheet
**Description:** Make the docs the new contract before any code changes. SPEC: the objective becomes a thematic web cheatsheet. Blitz, progress, Anki, weeks and one-screen are removed from objective, capability map, data contract, behaviour contracts, testing strategy and success criteria. Added: parts, groups, settings `{ theme, nikud, lang, hide }`, search, hide mode, print, routing `#/`, `#/<part>`, `#/<part>/<section>`. CONSTRAINTS: the "One screen" row becomes "No horizontal overflow" (0 px horizontal overflow at 360×640, 390×664, 1280×720; vertical scroll allowed). Add exception **E1**: floor-guard findings `test-deleted`, `assertion-removed`, `rule-removed`, `new-exception` for the Phase 1 paths, owner @yinon-mitin, approved 2026-10-20, expires 2026-11-20. Update CLAUDE.md: drop "weekly content updates".

**Acceptance criteria:**
- [x] SPEC has no mention of Blitz, Leitner, progress, Anki, weeks, `letters`, `showRu`, `uiLang`, one-screen. It describes parts, groups, `lang`, search, hide, print and the new routes.
- [x] CONSTRAINTS keeps every other threshold unchanged (coverage, weight, fonts, axe, external requests, security). E1 lists the exact paths to be deleted in Tasks 2–4.
- [ ] Owner has reviewed and approved the SPEC/CONSTRAINTS diff in the conversation (owner said to build through to Checkpoint 2; diff is reviewed there)

**Verification:**
- [x] `npm run check:fast`: the only findings are `rule-removed` (One screen) and `new-exception` (E1), as listed in E1
- [ ] Manual: owner reads the diff

**Dependencies:** None
**Files:** `SPEC.md`, `CONSTRAINTS.md`, `CLAUDE.md`
**Scope:** S

### Task 2: Remove Blitz, progress and Anki
**Description:** Delete the trainer and everything that exists only for it: Blitz core and UI, progress store/screen/core, Anki core and button, their i18n strings, `blitzMode` setting, the ⚙ "Progress & backup" link, Blitz links on home and section screens, `#/<section>/blitz` and `#/progress` routes (they fall back to the section / home). Code commit first, then a data commit that removes `blitz` and `confusables` from section JSON. The validator stops checking them in the code commit.

**Acceptance criteria:**
- [x] Deleted: `assets/js/core/{blitz,progress,anki}.js`, `assets/js/{blitz-view,progress-store}.js`, `assets/js/ui/progress-screen.js`, `tests/unit/{blitz,progress,anki}.test.mjs`, `tests/e2e/{blitz,progress,anki}.spec.mjs`
- [x] No reference to blitz/progress/anki remains in `assets/`, `tests/`, `data/` (`grep -ri` clean). `#/alphabet/blitz` shows the alphabet and `#/progress` shows home.
- [x] Remaining unit coverage of `core/` meets thresholds

**Verification:**
- [x] `npm run check:task`: green except the E1 floor-guard findings
- [ ] Manual: home and every section open, no Blitz/Anki buttons

**Dependencies:** Task 1
**Files:** `assets/js/main.js`, `assets/js/ui/{home,settings}.js`, `assets/js/core/{i18n,settings,schema}.js`, deleted files above, `data/sections/*.json`
**Scope:** M (mostly deletions)

### Task 3: Fold weeks into sections and remove the weeks mechanism
**Description:** Move every entry of `data/weeks/2026-10-11.json` into its section file. Ids stay the same. `vocab` has no groups. `greetings` splits into groups `small-talk` and `question-words` (eifo, eikh, kama, mi-ze, ma-ze). `gender-number` has no groups. Data commit first: entries move, `index.json` `weeks: []`, week file deleted. The current code still runs. Then the code commit removes `withWeeks`, `weekTabId`, `latestLetters`, `weekTitle`, `loadWeek(s)`, the week validator rules and `tests/e2e/weeks.spec.mjs`, and makes `weeks` absent from `index.json`.

**Acceptance criteria:**
- [x] Same set of entry ids before and after (171), each in the same section, each still `verified: false` where it was
- [x] No `week`/`weeks`/`letters` handling left in `assets/js/`, `scripts/`, `tests/`
- [x] `node scripts/validate.mjs` exits 0

**Verification:**
- [x] One-off id comparison (old merged ids vs new section ids) printed in the task notes
- [x] `npm run check:task`: green except E1 findings

**Dependencies:** Task 2
**Files:** `data/index.json`, `data/sections/{vocab,greetings,gender-number}.json`, `data/weeks/` (deleted), `assets/js/{loader,main}.js`, `assets/js/core/{content,schema,i18n}.js`, `tests/unit/{content,schema,i18n}.test.mjs`, `tests/e2e/{weeks.spec,helpers}.mjs`
**Scope:** M

### Task 4: Drop one-screen: scrolling sections, groups instead of tabs
**Description:** Rename `tabs`/`tab` to `groups`/`group` in the data contract (schema, content.js, data). A section page renders all its groups one after another with subheadings instead of a tab bar. CSS drops `height: 100dvh`, the `clamp()`-to-fit sizing and `[data-fit]`. The page scrolls. The 14/24-per-tab validator limit goes. The e2e one-screen check becomes a horizontal-overflow check (`scrollWidth <= clientWidth`) on every route. The visual style is still the old one; the redesign comes in Phase 2.

**Acceptance criteria:**
- [x] Every section shows all its entries on one scrollable page. Group subheadings appear in data order. No tab bar.
- [x] `ui/tabs.js` deleted. Validator has no per-group limit. `tests/e2e/helpers.mjs` has `expectNoHorizontalOverflow` instead of `expectOneScreen`.
- [x] Old `#/<section>/<tab>` hashes open the section scrolled to that group

**Verification:**
- [x] `npm run check:task`: green except E1 findings
- [x] Manual: phone screenshot of countries shows all 6 groups by scrolling

**Note (done):** the old CSS sized everything to the screen height, so it could not simply flow. The variant A base stylesheet (tokens, flow, views) landed here instead of in Task 6; Task 6 keeps the shell, navigation and contents page.

**Dependencies:** Task 3
**Files:** `assets/js/main.js`, `assets/js/core/{content,schema}.js`, `assets/css/app.css`, `assets/js/ui/tabs.js` (deleted), `data/sections/{alphabet,countries,geresh,greetings}.json`, `tests/e2e/{helpers,quality.spec,cheatsheet.spec}.mjs`, `tests/unit/{content,schema}.test.mjs`
**Scope:** M

## Checkpoint 1: Contract and removal
- [ ] `npm run check:task` green except the floor guard
- [ ] Floor-guard output compared line by line with E1. Nothing outside E1.
- [ ] Owner approves → `git push origin main`; CI floor-guard step red once, all other steps green. Deferred to Checkpoint 2 (owner: "build through to the screenshot checkpoint"); until then every task runs the floor guard and confirms its findings are all within E1
- [ ] After push, `npm run check:fast` is clean (base moved)

---

## Phase 2: Structure and design

### Task 5: Thematic parts: index.json, validator, router, contents page
**Description:** `data/index.json` becomes `{ "parts": [{ "id", "title": {en, ru}, "sections": [] }] }`: reading (alphabet, nikud, geresh), phrases (greetings), words (vocab, countries), grammar (gender-number). The validator requires every section file in exactly one part, unique part ids, and a title with en+ru. Pure `resolveRoute(hash, index)` in `core/content.js` maps `#/`, `#/<part>`, `#/<part>/<section>`, legacy `#/<section>[/<group>]` and unknown hashes. `#/` is a contents page that lists each part and its sections as links. A part page renders its sections in order, each with an `id` anchor.

**Acceptance criteria:**
- [x] Unit tests (first): `resolveRoute` for every route form, including legacy and unknown. Validator rules for parts.
- [x] `#/words/countries` opens Words scrolled to Countries. `#/countries/asia` opens Words at the Asia group.
- [x] Adding a section = a section file + one line in a part (README describes it)

**Verification:**
- [x] `npm run check:task` green (floor guard clean)
- [x] e2e: contents lists all parts/sections; every part route passes axe and overflow-x checks

**Dependencies:** Checkpoint 1
**Files:** `data/index.json`, `assets/js/core/{content,schema}.js`, `assets/js/{main,loader}.js`, `assets/js/ui/home.js` → `ui/contents.js`, `tests/unit/{content,schema}.test.mjs`, `tests/e2e/{navigation,shell}.spec.mjs`
**Scope:** M (code commit, then data commit for index.json; the code accepts both shapes in between)

### Task 6: Variant A design tokens and the new shell
**Description:** Rebuild `app.css` around tokens: `--paper`, `--ink`, `--ink-soft`, `--rule`, `--accent`, spacing and type scales, light + dark (system and `data-theme`). Hairline rules instead of bordered cards. Latin headings in the system serif stack. Hebrew sizes bigger. Shell: sticky slim header with wordmark, part navigation (links on laptop, horizontal scroll chips on phone, `aria-current`), and a controls slot. The contents page gets the typographic treatment: part titles as large serif headings, sections as a ruled list with their cursive icon.

**Acceptance criteria:**
- [x] All colors come from tokens. Contrast ≥ 4.5:1 for text, ≥ 3:1 for rules/controls, recorded in a comment beside the tokens.
- [x] Header stays ≤ 56 px tall on phone. Part navigation reachable without opening a menu. (Changed: brand, four parts and the controls do not fit one 390 px row, so the phone header has two sticky rows, ≤ 96 px; laptop one row ≤ 64 px. SPEC updated.)
- [x] axe 0 serious/critical in both themes on contents and every part

**Verification:**
- [x] `npm run check:task` green
- [x] Screenshots (phone/laptop × light/dark) of contents and one part attached to the task notes

**Dependencies:** Task 5
**Files:** `assets/css/app.css`, `index.html`, `assets/js/ui/contents.js`, `assets/js/ui/nav.js` (new), `assets/js/main.js`
**Scope:** M

### Task 7: Settings: one EN/RU switch, nikud, theme
**Description:** Settings become `{ theme, nikud, lang, hide }` with defaults `system`, `true`, `'en'`, `false`. `lang` replaces `uiLang` + `showRu`: it sets the interface strings and which translation is shown. Header controls: Nikud toggle, EN/RU segmented switch and theme toggle are all visible (no ⚙ menu). `hide` is wired in Task 11. Unused i18n strings are removed.

**Acceptance criteria:**
- [x] Unit (first): `parseSettings` defaults, field-by-field fallback, old `{uiLang, showRu, blitzMode}` objects parse without error to the new defaults
- [x] Switching to RU changes interface labels and every entry's translation to Russian. It is remembered after reload.
- [x] Works when `localStorage` throws

**Verification:**
- [x] `npm run check:task` green
- [x] e2e `settings.spec.mjs` rewritten for the new controls; theme and nikud cases kept

**Dependencies:** Task 6
**Files:** `assets/js/core/{settings,i18n}.js`, `assets/js/ui/settings.js`, `tests/unit/{settings,i18n}.test.mjs`, `tests/e2e/settings.spec.mjs`
**Scope:** M

### Task 8: Reading views: letters, print over cursive, nikud and geresh tables
**Description:** Restyle the reading views for variant A. Letters: a ruled grid, large print glyph, cursive glyph below in accent ink, name + sound in small caps, finals and variants as their own group. Print over cursive: rows read right to left like text. Nikud and geresh tables: full width, serif column headers, sound groups separated by rules, large vowel glyphs. Translations follow `lang`.

**Acceptance criteria:**
- [x] Alphabet at 390 px: 5–6 letters per row, print glyph ≥ 40 px. Laptop: 8–10 per row.
- [x] The nikud table fills the content width (no floating narrow column). Sound grouping is kept.
- [x] Existing cheatsheet e2e checks (Hebrew `lang`/`dir`, cursive font, RTL order, sound grouping, nikud toggle) still pass, adjusted for groups

**Verification:**
- [x] `npm run check:task` green
- [x] Screenshots of Reading (phone/laptop × light/dark)

**Dependencies:** Task 7
**Files:** `assets/js/views/{letter-grid,letter-rows,table}.js`, `assets/css/app.css`, `tests/e2e/cheatsheet.spec.mjs`
**Scope:** S–M

### Task 9: Dictionary views: phrases, words, countries, gender & number
**Description:** Replace `card-grid` with a `list` view: dictionary-style rows. Large Hebrew on the right, transliteration, translation in the current language, emoji when present, related words (a country's languages) on a second line with a label, `forms` (ms/fs/mp/fp) as a compact inline table when present. Responsive columns: 1 on phone, 2–3 on laptop. Rename in schema and data: `card-grid` → `list` (code commit accepts both, data commit renames).

**Acceptance criteria:**
- [x] Countries at 390 px: one entry per row, flag + Hebrew + translit + translation readable without zoom (Hebrew ≥ 22 px). Languages labelled.
- [x] gender-number shows forms for `talmid`, `medaber`, `gar`, `oved`
- [x] Nikud off shows `plain ?? stripNikud(he)` everywhere in the list

**Verification:**
- [x] `npm run check:task` green
- [x] Screenshots of Phrases, Words, Grammar (phone/laptop × light/dark)

**Dependencies:** Task 7 (parallel with Task 8)
**Files:** `assets/js/views/list.js` (new; `card-grid.js` deleted), `assets/js/core/schema.js`, `assets/css/app.css`, `data/sections/*.json`, `tests/e2e/cheatsheet.spec.mjs`
**Scope:** M

## Checkpoint 2: Design review
- [ ] `npm run check:task` green
- [ ] Owner reviews screenshots of every part, phone + laptop, light + dark, and approves or lists changes before Phase 3

---

## Phase 3: Cheatsheet tools

### Task 10: Search across all sections
**Description:** A pure `core/search.js` provides `normalize` (lowercase, stripNikud, strip geresh/apostrophe variants) and `searchSections(sections, query, lang)`. It returns matching entries grouped by part and section, matching on he/plain/related.he/translit/en/ru. UI: search field in the header (`/` focuses it, Esc clears). While the query is non-empty, a results view shows matches grouped by section, each linking to its place.

**Acceptance criteria:**
- [x] Unit (first): Hebrew with and without nikud, `שלום` finds `שָׁלוֹם`, translit case-insensitive, RU and EN, empty query, no match
- [x] e2e: typing "fra" shows France; "שפה" shows safa; clearing restores the page. Results announced via `aria-live`.
- [x] Search loads all sections lazily on first focus; first load stays ≤ 200 KB

**Verification:**
- [x] `npm run check:task` green; changed-line coverage ≥ 80%

**Dependencies:** Checkpoint 2
**Files:** `assets/js/core/search.js` (new), `tests/unit/search.test.mjs` (new), `assets/js/ui/search.js` (new), `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/search.spec.mjs` (new)
**Scope:** M

### Task 11: Hide-translations self-check mode
**Description:** A "Hide" toggle (setting `hide`; done: under each part title, since the phone header has no room left) blurs translations and transliterations in list and table views. Each hidden value is a button that reveals itself on click/Enter/Space; turning Hide off reveals everything. Letters keep their names visible (the alphabet is reference, not quiz).

**Acceptance criteria:**
- [x] Hidden values are not readable visually and have an accessible name "Show translation". Revealed state is `aria-expanded="true"`.
- [x] Remembered across reloads; axe clean with Hide on, both themes

**Verification:**
- [x] `npm run check:task` green
- [x] e2e: hide → value hidden → click reveals one → toggle off reveals all

**Dependencies:** Task 10 (header layout settled)
**Files:** `assets/js/ui/settings.js`, `assets/js/views/{list,table}.js`, `assets/css/app.css`, `tests/e2e/settings.spec.mjs`
**Scope:** S

### Task 12: Print stylesheet (A4)
**Description:** `@media print`: hide header, navigation, search and controls. Black ink on white. Every section starts with its heading, groups avoid breaking inside, lists go to 2 columns, and Hebrew sizes are fixed in pt. Printing `#/reading` gives a clean A4 sheet set. Hide mode is ignored in print (everything visible).

**Acceptance criteria:**
- [x] Playwright `page.pdf({ format: 'A4' })` of each part succeeds. No horizontal clipping (text width ≤ page width), checked with the print media emulation.
- [x] No controls in the printed output

**Verification:**
- [x] `npm run check:task` green
- [ ] Manual: owner opens the generated PDFs of Reading and Words

**Dependencies:** Task 11
**Files:** `assets/css/app.css`, `tests/e2e/print.spec.mjs` (new)
**Scope:** S

### Task 13: README, cleanup, release
**Description:** README rewritten for the cheatsheet: what it is, parts, search, hide, print, how to add or change content (section file + part in index.json, `verified` rules), commands, fonts. Remove leftovers: unused CSS, i18n strings, the subset of e2e helpers nobody calls. E1 marked closed in CONSTRAINTS (row moved to a closed note, not deleted). `docs/ideas/ivrit-studio.md` gets a short "2026-10-20: pivot to cheatsheet" note at the top.

**Acceptance criteria:**
- [ ] README has no Blitz/progress/Anki/weeks. A new contributor can add a section from README + SPEC Data Contract alone.
- [ ] `npm run check:full` green

**Verification:**
- [ ] `npm run check:full` green
- [ ] Owner approves push → CI green → site checked on a real phone

**Dependencies:** Task 12
**Files:** `README.md`, `CONSTRAINTS.md`, `docs/ideas/ivrit-studio.md`, `assets/css/app.css`, `assets/js/core/i18n.js`
**Scope:** S

## Checkpoint 3: Complete
- [ ] All acceptance criteria above met
- [ ] `npm run check:full` and CI green
- [ ] Owner opens the published site on a phone in both themes and both languages
