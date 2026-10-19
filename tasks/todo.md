# Ivrit Studio MVP — Tasks

Plan and decisions: `tasks/plan.md`. Contract: `SPEC.md`. Quality bar: `CONSTRAINTS.md`.

Every task's Definition of Done: `npm run check:fast` after edits, `npm run check:task` green before each commit, test written before core code, no floor violations. Data and code go in separate commits.

---

## Phase 1: Foundation

### Task 1: Baseline commit
**Description:** Add the static-hosting and repo basics, then make the first commit of the existing tooling so the floor guard and history have a base.

**Acceptance criteria:**
- [x] `.nojekyll`, `LICENSE` (MIT), and a short `README.md` (what it is, commands, link to SPEC) exist
- [x] First commit contains tooling + these files. `node_modules/`, `coverage/`, `test-results/`, `.DS_Store` are not tracked

**Verification:**
- [x] `npm run check:task` green
- [x] `git ls-files` shows no ignored paths

**Dependencies:** None
**Files:** `.nojekyll`, `LICENSE`, `README.md`
**Scope:** XS

### Task 2: `hebrew.js` — nikud handling
**Description:** Pure helpers used by every view and by the validator: `stripNikud`, `isHebrew` (contains ≥ 1 Hebrew letter), `displayHe(entry, nikudOn)` → `he` or `plain ?? stripNikud(he)`.

**Acceptance criteria:**
- [x] `stripNikud` removes exactly the SPEC ranges and keeps maqaf U+05BE, geresh U+05F3, gershayim U+05F4, apostrophe (tests: `שָׁלוֹם`, `בּ`, `צ'ילה`, `ז׳נבה`, maqaf phrase)
- [x] `displayHe` prefers `plain` when nikud is off, and returns `he` unchanged when on
- [x] `isHebrew` is false for Latin/Cyrillic/empty strings and for a string of only nikud marks

**Verification:**
- [x] `node --test tests/unit/hebrew.test.mjs` (written first, seen failing)
- [x] `npm run test:coverage`: core thresholds met

**Dependencies:** T1
**Files:** `assets/js/core/hebrew.js`, `tests/unit/hebrew.test.mjs`
**Scope:** S

### Task 3: Data contract — `schema.js` + validator
**Description:** Enforce the SPEC Data Contract. `validateSection`, `validateWeek` and `validateAll({ index, sections, weeks })` return `{ errors, warnings }`. `scripts/validate.mjs` exports `loadData(dir)` and exits non-zero on errors. Seed `data/index.json` (`{ "sections": [], "weeks": [] }`). Activates the "Data valid" constraint row.

**Acceptance criteria:**
- [x] One failing-then-passing unit test per validator rule: id unique + `<section>.<slug>`; required fields; `he` has a Hebrew letter; dangling `tab` / `confusables` / `blitz.ask|answer` / `week.items[].section` / index → missing file; > 14 per tab (24 for `letter-grid`/`letter-rows`); unknown `view`; an empty `letter-rows` tab is allowed (Open Question 1)
- [x] `verified: false` count is reported as a warning, not an error
- [x] `tests/unit/data.test.mjs` runs `validateAll(loadData('data'))` and fails on any error

**Verification:**
- [x] `node scripts/validate.mjs` → exit 0 on seed data. A temp copy of the data with a broken file → exit 1
- [x] `npm run check:task` green

**Notes:** Also enforced beyond SPEC: section/week shape (slug id, `title.en/ru`, `items` array, `YYYY-MM-DD`, `letters` = Hebrew letters), section/week id = file name, files ↔ `index.json` both ways, entries need a tab when the section has tabs, unique blitz template ids. Global id uniqueness follows from per-section uniqueness + the `<section>.` prefix + unique file names. Open for T14: a week adding untabbed entries to a section that has untabbed entries of its own (e.g. `geresh`) is currently an error ("needs a tab").

**Dependencies:** T2
**Files:** `assets/js/core/schema.js`, `scripts/validate.mjs`, `tests/unit/schema.test.mjs`, `tests/unit/data.test.mjs`, `data/index.json`
**Scope:** M

### Task 4: Fonts — subset Heebo + Gveret Levin (high risk, early)
**Description:** `scripts/subset-fonts.sh` (`pipx run --spec 'fonttools[woff,unicode]' pyftsubset`) produces `woff2` for Hebrew + nikud (U+0590–05FF, U+FB1D–FB4F), Basic Latin and common punctuation. Heebo is instanced to the weight(s) the UI uses. Add `"fonts"` npm script. *Ask before downloading if the Gveret Levin license is unclear (plan Open Question 3).*

**Acceptance criteria:**
- [x] `assets/fonts/heebo.woff2` and `gveret-levin.woff2` are each ≤ 60 KB
- [x] `OFL-Heebo.txt` and `OFL-GveretLevin.txt` are present, and the README credits the sources
- [x] A scratch page (not committed) renders `שָׁלוֹם, מַה שְּׁלוֹמֵךְ? בְּבַיִת` correctly in both fonts (screenshot reviewed)

**Verification:**
- [x] `npm run fonts` is reproducible; `ls -l assets/fonts/*.woff2` is within budget
- [x] `npm run check:fast` green

**Notes:** Source: `google/fonts` @ `47d54ca` (`ofl/heebo`, `ofl/gveretlevin`), both OFL 1.1, so Open Question 3 is settled. Sizes: Heebo 29,260 B (variable, wght 400–700), Gveret Levin 23,624 B. Both cover all 27 letters and every nikud mark except meteg U+05BD (not used). Neither has the dotted circle U+25CC, so a bare nikud sign falls back to a system font; use example letters (as T12 plans). Downloads go to the gitignored `.fonts-src/`. `SOURCE_DATE_EPOCH=0` makes the output byte-identical between runs. The script fails if a font is over 60 KB.

**Dependencies:** T1
**Files:** `scripts/subset-fonts.sh`, `assets/fonts/*`, `package.json`, `README.md`
**Scope:** S

### Checkpoint: Foundation
- [ ] `npm run check:task` green, core coverage ≥ thresholds
- [ ] Font sizes known and within budget
- [ ] Human review: Open Questions 1 and 3 answered

---

## Phase 2: First vertical slice — Alphabet on a phone

### Task 5: App shell, home, router + e2e quality harness
**Description:** `index.html` (noindex, CSP `default-src 'self'`, `lang`, viewport), `app.css` (light/dark tokens via `prefers-color-scheme` + `[data-theme]`, `100dvh` grid: header + tabs + content, `@font-face`), `main.js` hash router (`#/`, `#/<section>/<tab?>`, `#/<section>/blitz`, `#/progress`, unknown → home), `loader.js`, home grid from `index.json`. Data-driven e2e harness: `helpers.mjs` (`expectOneScreen`, `expectNoAxe`, request log, route enumeration from `data/`), and `quality.spec.mjs` covering every route. Activates the app-shell constraint rows.

**Acceptance criteria:**
- [x] Home renders on one screen at 360×640 and 1280×720 with 0 serious/critical axe violations, in light and dark
- [x] The e2e fails on any request to another origin, on first-load weight > 200 KB, and on any `woff2` > 60 KB
- [x] The route list is computed from `data/`: adding a section JSON adds its routes to the e2e with no test edit

**Verification:**
- [x] `npm run e2e:fast` green (webkit 390×664 also green)
- [x] Manual: phone (light) and laptop (dark) screenshots of home reviewed
- [x] `npm run check:task` green (~4 s)

**Notes:** Fault injection showed the harness catches content overflow, document overflow, an external request (with CSP removed) and dark-only low contrast. The harness also fails on any uncaught page error. Until T6/T17/T19 add their screens, section, Blitz and `#/progress` routes render home, so their quality checks pass trivially for now. The "Sections" label is English until T8 (i18n). Every screen waits on `#app[data-ready="true"]`; new screens must keep setting it.

**Dependencies:** T3 (T4 for the font-size test to have files)
**Files:** `index.html`, `assets/css/app.css`, `assets/js/main.js`, `assets/js/loader.js`, `assets/js/ui/home.js`, `tests/e2e/helpers.mjs`, `tests/e2e/quality.spec.mjs`
**Scope:** M (files are small; split header into its own module only if `main.js` grows)

### Task 6: Alphabet cheatsheet — `letter-grid` + tabs
**Description:** `content.js` (pure: `tabsOf(section)`, `itemsForTab(section, tabId)`, default tab), `ui/tabs.js` (tap-switch, `#/<section>/<tab>`), `views/letter-grid.js` (print glyph in Heebo, cursive below in Gveret Levin, name + translit). Commit 1: code + unit tests. Commit 2: `data/sections/alphabet.json` (22 letters + 5 finals + בּ/כּ/פּ/שׁ/שׂ, split into tabs ≤ 24, `nikudToggle: false`, blitz templates such as `print-to-name` and `cursive-to-print`, confusables ה/ח/ת, ד/ר, ו/ז/ן, ס/ם, ב/כ, all `verified: false`) registered in `index.json`.

**Acceptance criteria:**
- [x] Every alphabet tab passes one-screen at 360×640 / 1280×720 (resolves the SPEC open question about the 24 limit). *`showRu` doesn't exist until T11; T11 re-checks every tab in that densest mode*
- [x] Hebrew nodes have `lang="he" dir="rtl"`. Cursive glyphs use Gveret Levin (`document.fonts.check`)
- [x] `content.js` unit tests cover default tab, unknown tab → default, and sections without tabs

**Verification:**
- [x] `npm test`, `node scripts/validate.mjs`, `npm run e2e:fast` (+ webkit 390×664)
- [ ] Manual: phone-size screenshot of `#/alphabet` reviewed by a human (agent-reviewed at 360×640 and 1280×720; human review at the Phase 2 checkpoint)
- [x] `npm run check:task` green before each of the two commits

**Notes:** Tabs are `letters` (22 letters in order; בּ כּ פּ שׁ are the named forms) and `variants` (ב כ פ שׂ + 5 finals), so the 24 limit holds. Letter cells sit in a 5-column grid in portrait and 8 columns in landscape. At 360×640 a cell is 64×106 px, print glyph ≈ 32 px, cursive ≈ 25 px, label ≈ 9.6 px. Line heights must stay ≥ each font's content area (Heebo 1.47 em, Gveret Levin 1.3 em) or glyphs spill. The new `[data-fit]` harness check catches this, and views should mark their cells with it. `views/dom.js` (`el`, `hebrew`) is the shared builder for all views.

**Dependencies:** T5
**Files:** `assets/js/core/content.js`, `tests/unit/content.test.mjs`, `assets/js/ui/tabs.js`, `assets/js/views/letter-grid.js`, `assets/js/main.js`, `data/sections/alphabet.json`, `data/index.json`
**Scope:** M

### Task 7: "Print over cursive" tab — `letter-rows`
**Description:** `views/letter-rows.js`: a row of print letters directly above the same letters in cursive, for practising cursive reading. Add the alphabet tab per the answer to Open Question 1.

**Acceptance criteria:**
- [x] `#/alphabet/<rows-tab>` shows every letter print-over-cursive, aligned per column, RTL order
- [x] One-screen + axe pass on all three viewports (webkit in `check:full`)

**Verification:**
- [x] `npm run e2e:fast`, `npm run check:task` (+ webkit 390×664)
- [ ] Manual: compare with the teacher's handwriting (SPEC manual check; needs the human with a photo of the board or a handout)

**Notes:** Decided 2026-10-19 (Open Question 1): a `letter-rows` tab without entries of its own shows every entry of the section. The rule lives in `content.itemsForTab` (uses the effective view) and is mirrored by `helpers.sectionRoutes` counts. The tab is `#/alphabet/rows`, all 31 letters in data order. Columns: 8 in portrait (≈42×127 px at 360×640, print ≈33 px), 11 in landscape.

**Dependencies:** T6
**Files:** `assets/js/views/letter-rows.js`, `assets/js/main.js` (view registry), `data/sections/alphabet.json`
**Scope:** S

### Task 8: Settings — theme + interface language
**Description:** `storage.js` (try/catch wrapper with in-memory fallback, key `ivrit-studio:settings`), `core/i18n.js` (UI strings `{ en, ru }`, `pickLang(navigator.language)`, `t(key, lang)`), and header controls for theme `system|light|dark` and UI language. Every UI string goes through i18n.

**Acceptance criteria:**
- [x] The theme toggle cycles system → light → dark and persists across reload. `prefers-color-scheme` is honoured on `system` (e2e, both schemes) and both themes pass axe
- [x] UI language defaults from `navigator.language` (ru* → ru, else en), switches every label, and persists
- [x] With `localStorage` throwing, the site still loads and toggles work for the session (e2e)

**Verification:**
- [x] `node --test tests/unit/i18n.test.mjs tests/unit/settings.test.mjs`, `npm run e2e:fast` (`settings.spec.mjs` incl. home screenshots in both themes, attached to the report rather than compared, since macOS and Linux CI render differently)
- [x] `npm run check:task` green (8 s; webkit 390×664 also green)

**Notes:** Added `core/settings.js` (defaults, field-by-field validated parsing, theme cycle) so a broken stored value can't break the site. Theme applies as `data-theme` on `<html>` (absent = follow the system) and the UI language as `<html lang>`. The theme button shows Auto/Light/Dark with accessible name "Theme: …". EN/RU is a pressed-button group. Focus is restored after the re-render, and a fault check confirmed the test catches its absence. Known: the saved theme applies when the JS module runs, so a dark-system user who chose Light may see a dark flash on load. An inline head script would fix it, but the CSP forbids inline scripts.

**Dependencies:** T5
**Files:** `assets/js/storage.js`, `assets/js/core/i18n.js`, `tests/unit/i18n.test.mjs`, `assets/js/ui/settings.js`, `assets/css/app.css`, `tests/e2e/settings.spec.mjs`
**Scope:** M

### Checkpoint: Alphabet slice
- [ ] `npm run check:task` green. First-load weight and font sizes reported
- [ ] Human opens Alphabet on a real phone (local network) in both themes and both languages
- [ ] Review with human before content-heavy Phase 3

---

## Phase 3: Cheatsheet content

### Task 9: `card-grid` view + Countries part I
**Description:** `views/card-grid.js` (emoji, Hebrew, translit, meaning, `related` languages). Commit 2: `data/sections/countries.json` with tabs EU I (14), EU II (13), Russia & Europe outside the EU (9). Each country lists all main languages in `related`. Blitz templates `flag-to-he`, `he-to-meaning` and `country-to-language` (`related.he`). All entries `verified: false`.

**Acceptance criteria:**
- [x] Three tabs, 36 countries, each tab ≤ 14, valid against the validator
- [x] Each tab passes one-screen + axe at 360×640 / 1280×720. *`showRu` arrives in T11, which re-checks these tabs in that mode; the meaning line is the likely pressure point*
- [x] Transliteration follows the SPEC rules (kh/tz/sh/j/ch/zh)

**Verification:**
- [x] `node scripts/validate.mjs` (warning count = 36 unverified), `npm run e2e:fast`, `npm run check:task` (+ webkit 390×664)

**Notes:**
- Card layout: the start side holds flag + Hebrew + transliteration + meaning, and the end side stacks the languages, sized by `data-count`.
- At 360×640 a card is 170×69 px: country ≈ 15 px, lines ≈ 10 px, 1–2 languages ≈ 10 px, Switzerland's 4 ≈ 8 px. *Human check on a real phone: is that readable with nikud?*
- The harness now checks every entry shows its `he` and related `he`, for all views.
- Content decisions to confirm:
  - (a) Transliteration follows the SPEC rule `צ → tz` ("Tzarfat"), although the SPEC example says "Tsarfat".
  - (b) Geresh is U+05F3 `׳` (צֶ׳כְיָה), not an ASCII apostrophe.
  - (c) `plain` is also used inside `related` items (יוונית, שוודית) so languages show standard spelling without nikud. That's an optional field the Data Contract doesn't list for `related`.
  - (d) Country names follow Hebrew Wikipedia (הולנד, בריטניה, שווייץ). Finland also lists Swedish, Ireland lists English, Malta lists English, and Belarus lists Russian.
- All nikud is unverified (Dicta Nakdan pass pending).

**Dependencies:** T6
**Files:** `assets/js/views/card-grid.js`, `assets/js/main.js`, `data/sections/countries.json`, `data/index.json`
**Scope:** M

### Task 10: Countries part II (data only)
**Description:** Add the Asia (14), Americas (10) and Middle East/Africa/Oceania (13, Israel first) tabs. Spellings follow Hebrew Wikipedia. Nikud is unverified.

**Acceptance criteria:**
- [x] 6 tabs, about 73 countries total, every tab ≤ 14, Israel first in its tab
- [x] Validator and one-screen e2e pass with no code change

**Verification:**
- [x] `node scripts/validate.mjs`, `npm run check:task` (+ webkit 390×664; 123 e2e across three projects)

**Notes:** 73 countries: 14/13/9/14/10/13. Long names fit without code changes (קוֹרֵיאָה הַדְּרוֹמִית, אִיחוּד הָאֲמִירוּיוֹת, עֲרָב הַסְּעוּדִית). Six tabs wrap to two rows on a phone in EN and RU. Four-language cards (Singapore, South Africa, Switzerland) have the smallest text (≈ 8 px). Human check on a real phone. Content choices to confirm: South Africa lists Zulu, Xhosa, Afrikaans, English (of 11 official); Singapore lists English, Malay, Chinese, Tamil; India lists Hindi + English; UAE uses the short name אִיחוּד הָאֲמִירוּיוֹת; USA is אַרְצוֹת הַבְּרִית. Classmates' home countries (SPEC open question) are not added yet. 104 entries site-wide are `verified: false`.

**Dependencies:** T9
**Files:** `data/sections/countries.json`
**Scope:** S

### Task 11: Nikud + RU-translation toggles
**Description:** Header toggles `nikud` (default on) and `showRu` (default off), persisted in settings. Views render via `displayHe`. Sections with `nikudToggle: false` ignore the nikud setting. Extend the harness to check both nikud states.

**Acceptance criteria:**
- [x] On countries, toggling nikud changes the Hebrew text (`plain` wins when present). On alphabet it changes nothing (e2e)
- [x] `showRu` adds RU next to EN in every view, and one-screen still passes (densest mode)
- [x] Both toggles persist across reload

**Verification:**
- [x] `npm run e2e:fast`, `npm run check:task` (14 s; webkit 390×664 also green, 138 e2e across three projects)

**Notes:**
- **Header redesign.** Five controls don't fit 360 px (≈390 needed). The header now holds the brand, the **Nikud** toggle (`aria-pressed`, used constantly) and a **⚙** `<details>` menu with theme, EN/RU and "Russian translation". The menu stays open across re-renders, so focus is restored. Escape closes it (focus returns to ⚙), and so does a click outside. That check uses `event.composedPath()`, because a click inside re-renders the menu before the event reaches `document`. Axe passes with the menu open in both themes.
- **Nikud setting.** Views get `{ nikud, showRu }`. Nikud is `settings.nikud || section.nikudToggle === false`, and related words use `displayHe` too.
- **Densest mode.** With RU on, letter cells and cards add a Russian line and shrink their glyphs (`[data-ru]` overrides).
- **Harness.** Every route is now checked with `showRu: true` seeded, and one-screen is re-checked after turning nikud off.

**Dependencies:** T8, T9
**Files:** `assets/js/ui/settings.js`, `assets/js/views/*.js`, `tests/e2e/helpers.mjs`, `tests/e2e/settings.spec.mjs`
**Scope:** M

### Task 12: `table` view + Nikud section
**Description:** `views/table.js` (rows × columns with Hebrew cells). Commit 2: `data/sections/nikud.json`: each vowel sign on an example (בַּ בֶּ בִּ בּוֹ בּוּ בְּ …) with translit, and same-sound pairs (kamatz/patach, segol/tsere) noted. `nikudToggle: false`. Blitz template `syllable-to-reading`.

**Acceptance criteria:**
- [x] Nikud section on one screen (tabs if > 14), axe clean in both themes
- [x] Same-sound pairs are visibly grouped and listed as `confusables`

**Verification:**
- [x] `node scripts/validate.mjs`, `npm run e2e:fast`, `npm run check:task` (+ webkit; 150 e2e across three projects)

**Notes:**
- **Content.** 14 signs on one screen without tabs, ordered by sound: a (patah, kamatz, hataf patah), e (segol, tzere, hataf segol), i (hirik, hirik male), o (holam, holam male, hataf kamatz), u (kubutz, shuruk), sheva.
- **Grouping.** Consecutive equal `translit` values share one sound cell. That's generic, so no new data field is needed, and an e2e check covers it.
- **Content choice to confirm.** Every sign is shown on בּ for a uniform chart, including the hataf vowels (בֲּ בֱּ בֳּ), which in real words sit under gutturals (אֲ, עֱ). The teacher may prefer א for those. Sheva reads "b’ / be".
- **Sizing.** The Hebrew takes the largest size a row allows (≈25 px phone, ≈27 px laptop), which is height-limited with 14 rows. The table is capped at 36 rem wide.
- **Fault check.** An oversized table fails the one-screen check (294 px overflow), so tables are covered.

**Dependencies:** T6
**Files:** `assets/js/views/table.js`, `assets/js/main.js`, `data/sections/nikud.json`, `data/index.json`
**Scope:** M

### Task 13: Geresh section (data only)
**Description:** `data/sections/geresh.json`: the sound table (`ג׳`=j, `צ׳`=ch, `ז׳`=zh, `וו`=v/w) and example loanwords (`סרג'יו`, `צ'ילה` vs `צ'ילי`, `וודקה`, `וואטסאפ`, `ג'ינס`, `ז'נבה`, `צ'יפס`). Uses an existing view. Blitz template `translit-to-he`.

**Acceptance criteria:**
- [x] Valid, one screen, axe clean. *No changes to logic. The new data exposed a table CSS bug, fixed in its own commit (see notes)*
- [x] Geresh is preserved when nikud is off (covered by T2 rules, spot-checked e2e)

**Verification:**
- [x] `node scripts/validate.mjs`, `npm run check:task` (+ webkit; 207 e2e across three projects; `check:task` e2e ≈ 27 s)

**Notes:**
- **Structure.** Tabs are `sounds` (table: ג׳ j, צ׳ ch, ז׳ zh, וו v/w) and `words` (card-grid: jeans, Sergio, Chile, chili, chips, Geneva, vodka, WhatsApp, with emoji).
- **New e2e check** (separate commit `d79768f`). Every Cheatsheet route is checked with nikud off: each entry shows `displayHe(entry, false)`, or keeps its nikud for `nikudToggle: false`. A fault check confirmed it fails when a view ignores the setting.
- **Fix found by the data** (`fix(views)` commit). Short tables have tall rows, so text hit width caps measured on the wrapper, not the 36 rem table, and RU names overflowed sideways. Added rem ceilings and let the name wrap; it had lost a specificity fight with `td { nowrap }`. Cards without related words now give the Hebrew the full width (17 → 21 px on a phone).
- **Content to confirm.** Geresh is written after the nikud (גִ׳ינְס). WhatsApp is unpointed (`וואטסאפ`, a brand) with a `note` giving `ווטסאפ`. "Chips" means French fries.

**Dependencies:** T11, T12
**Files:** `data/sections/geresh.json`, `data/index.json`
**Scope:** S

### Task 14: Weeks → Vocab section
**Description:** `content.js` `mergeWeeks(sections, weeks)` (pure) appends week items to their section under the auto tab `week-<date>`, and exposes `latestLetters(weeks)`. The loader fetches the weeks listed in `index.json`. The i18n title for week tabs is generated. Commit 2: `data/sections/vocab.json` (empty items) + `data/weeks/2026-10-11.json` derived from the teacher's summary. **Blocked on Open Question 2 for the data commit.**

**Acceptance criteria:**
- [x] Unit tests: items land in the right section/tab, multiple weeks are ordered by date, `latestLetters` returns the latest week's letters
- [x] `#/vocab/week-2026-10-11` renders on one screen. Tabs over 14 fail the validator (split guidance in README: T21)
- [x] The week file passes the validator with no code change. *Not a true SC9 dry run: the agent that wrote it had full context. Do the dry run with a fresh agent next week*

**Verification:**
- [x] `npm test`, `npm run e2e:fast`, `npm run check:task` for the code half (20 s; 216 e2e across three projects)
- [x] `node scripts/validate.mjs` with `data/weeks/2026-10-11.json` + the sections it feeds (data half; 174 e2e chromium, 87 webkit)

**Status:** done. Data commit `df4bc6b`: the week (41 entries) feeds three sections, because a tab holds ≤ 14. `vocab` "Words" (13), `greetings` "Questions & small talk" (14) and `gender-number` "Gender & number" (14, with `forms` + `related`). The last two are SPEC's post-MVP sections, added as data only. `letters` is assumed to be every letter except ק צ ץ: the summary lists only this week's letters and says a few are still to come. Fix it in the week file if wrong.

**Notes:**
- `content.withWeeks(section, weeks)` is per section (the plan said `mergeWeeks(sections, weeks)`; one section is what a screen loads). Week tabs come after the section's own tabs, newest first, so `#/vocab` opens on the current week. Tab objects are `{ id: 'week-<date>', week }`, and the title comes from `i18n.weekTitle` via `Intl` with the date read as UTC ("Week of 11 Oct" / "Неделя 11 окт.").
- `weekTabId` moved to `content.js`; `schema.js` imports it, so app and validator share one definition.
- `loader.loadSectionWithWeeks` loads every week in `index.json`.
- The harness orders week routes newest first, like the app.

**Dependencies:** T3, T6
**Files:** `assets/js/core/content.js`, `tests/unit/content.test.mjs`, `assets/js/loader.js`, `assets/js/core/i18n.js`, `data/sections/vocab.json`, `data/weeks/2026-10-11.json`, `data/index.json`
**Scope:** M

### Checkpoint: Cheatsheets complete
- [ ] All 5 MVP sections open on one screen at 360×640 / 1280×720 (and webkit 390×664 via `npm run e2e:webkit`)
- [ ] Validator warning count = number of entries awaiting human nikud verification
- [ ] Human review of content before building Blitz

---

### Task 14b: Design pass — visual language, accents, navigation (added 2026-10-19 at the user's request)
**Description:** A modern, pleasant look and clear navigation on phone and laptop, before Blitz and progress are built, so they use it from the start. Covers: typography and colour accents (tokens), header and back navigation, home as a real entry point (sections with an icon, count and "Blitz" action), section screen head (title, tabs, actions), consistent controls, focus/hover/pressed states, and motion that respects `prefers-reduced-motion`.

**Acceptance criteria:**
- [x] One documented token set (colour, accent, radius, spacing, type scale) in `app.css`, light + dark, axe-clean
- [x] Home lists every section as a card with its icon, title, entry count and a Blitz action. A section screen always offers a way back home
- [x] Every existing e2e check stays green (one screen at 360×640 / 390×664 / 1280×720, densest mode, both themes)

**Verification:**
- [x] `npm run check:task` + webkit; screenshots of home, a section, a dense tab and the menu on phone and laptop in both themes reviewed

**Notes:**
- **Commits.** `e0ef17a` (code) and `eff0622` (icons data).
- **Visual idea: a study notebook.** Paper `#f6f7fb`, white sheets, ruled lines, ink `#2445c8` for cursive and anything actionable, highlighter `#ffe14d` under the current tab; the night desk `#11151f` in dark.
- **Home.** Tiles show a cursive icon, the title, a pluralised card count (`Intl.PluralRules`) and a Blitz link. Section screens have a bar with back, title and Blitz.
- **Motion.** Colour transitions were dropped: they also ran on theme switches, and axe caught unreadable mid-transition colours. Only `transform` animates, and only without reduced motion.
- **`icon`.** A new optional section field `icon`, validated and documented in SPEC.

**Dependencies:** T13, T14
**Files:** `assets/css/app.css`, `index.html`, `assets/js/ui/home.js`, `assets/js/ui/tabs.js`, `assets/js/main.js`, `assets/js/core/i18n.js`, tests as needed
**Scope:** M

### Checkpoint: Design
- [ ] Screens look intentional and consistent on phone and laptop; navigation is obvious

---

## Phase 4: Blitz & progress

### Task 15: `progress.js` — progress model
**Description:** Pure: `emptyProgress()`, `record(progress, key, correct, now, confusedWithId?)` (Leitner: correct → box+1 capped at 5, wrong → box 1, `seen`/`wrong`/`lastSeen`/`confusedWith`), `serialize`, `parse` (rejects foreign `app`, newer `version`, broken JSON with a typed error; migrates older versions), `merge(local, incoming)` (union, newer `lastSeen` wins). `storage.js` gains progress get/set under `ivrit-studio:progress`.

**Acceptance criteria:**
- [x] Unit tests for every SPEC progress rule, including "rejection leaves local data untouched" and migration from a v0 fixture
- [x] `merge` is commutative on non-conflicting keys and deterministic on ties
- [x] Core coverage thresholds still met

**Verification:**
- [x] `node --test tests/unit/progress.test.mjs`, `npm run check:task`

**Notes:**
- **Never throws.** `parse` returns `{ ok, progress }` or `{ ok: false, error }` with error `invalid-json`, `not-ivrit-studio`, `newer-version` or `invalid-format`. The caller can't touch local data on an error.
- **Version 0** (defined here so migration has a path): cards with only `box` and `lastSeen`.
- **Ties.** `merge` keeps the local record on a tie.
- **Persistence** (`ivrit-studio:progress` via `storage.js`) is wired with the Blitz UI in T17, where it is first used.

**Dependencies:** T3
**Files:** `assets/js/core/progress.js`, `tests/unit/progress.test.mjs`, `assets/js/storage.js`
**Scope:** S

### Task 16: `blitz.js` — card selection and distractors
**Description:** Pure, RNG passed in: `cardKeys(section, templates, letters?)`, `buildSession(section, progress, rng, { size: 10, maxNew: 3, letters })` using weights `{0:4,1:16,2:8,3:4,4:2,5:1}`, `fieldValue(entry, field)` for `he|heCursive|translit|meaning|emoji|related.he|forms.*`, `distractors(entry, field, section, progress, rng)` → 3, in priority order: personal `confusedWith` → `confusables` group → same tab → section, with no duplicates or equal display values.

**Acceptance criteria:**
- [x] Seeded-RNG tests: weights are respected statistically, ≤ 3 new cards, 10 questions (cards repeat when the pool is small)
- [x] Distractor tests: priority order, no duplicates, the correct answer is always among the 4, and it works when a section has < 4 entries
- [x] Alphabet with weeks present limits cards to `latestLetters`

**Verification:**
- [x] `node --test tests/unit/blitz.test.mjs`, `npm run check:task`

**Notes:** SPEC says 10 questions and ≤ 3 new cards per session, which together would make a first session only 3 questions long. Decision: the session is always 10 questions, drawn *with repetition* from the pool (all seen cards + ≤ 3 new), by box weight, never the same card twice in a row. `cardKeys(section, letters)` filters by base letter (dagesh and dots ignored). `distractors` dedupes by the displayed answer text. `fieldValue(…, 'related.he')` joins the related words.

**Dependencies:** T14, T15
**Files:** `assets/js/core/blitz.js`, `tests/unit/blitz.test.mjs`
**Scope:** M

### Task 17: Blitz UI — multiple choice
**Description:** `blitz-view.js` at `#/<section>/blitz`: template picker (when the section has several), a 10-question session, 4 options, feedback, results summary. Each answer is recorded via `progress.record` + `storage.js`, and a wrong pick goes to `confusedWith`. Add a "Blitz" entry point to the cheatsheet header.

**Acceptance criteria:**
- [x] e2e: 10 questions can be completed on alphabet and countries. A deliberate wrong answer shows up in `ivrit-studio:progress` with `box: 1` and `confusedWith`
- [x] Every section's Blitz route passes one-screen + axe (auto via harness)
- [x] Works with storage unavailable (progress lives until reload)

**Verification:**
- [x] `npm run e2e:fast` (`blitz.spec.mjs`), `npm run check:task` (+ webkit; 306 e2e across three projects)

**Notes:**
- **Screens.** Setup lists the exercises ("All mixed" by default, then `Field → Field` names from i18n) and a Start button. A question shows a counter, a prompt that fills the free height (cursive in ink, emoji large, letters and syllables extra large via `data-short`) and up to 4 options in a 2×2 grid. Feedback marks correct (green, 2 px) and wrong (red) and announces itself in a `role=status` region, with focus on Next. Results show the score, Again and Other exercise.
- **State.** Session state is kept per section in `blitz-view.js`, so settings changes (re-renders) mid-session don't lose it. That's tested with nikud.
- **Alphabet.** It uses `latestLetters` of the weeks.
- **Storage.** `progress-store.js` reads/writes `ivrit-studio:progress`; unreadable stored progress starts empty.
- **Harness.** Each Blitz route is checked for one screen + axe at setup, question (both themes) and feedback.

**Dependencies:** T16
**Files:** `assets/js/blitz-view.js`, `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/blitz.spec.mjs`
**Scope:** M

### Task 18: Blitz UI — flashcards
**Description:** Second mode in the same view: show the prompt, tap to flip, then "knew / didn't know". Recorded with the same Leitner rules (no `confusedWith`). Mode choice is remembered in settings.

**Acceptance criteria:**
- [x] e2e: flip, mark "didn't know" → card `box: 1`. Mark "knew" → box increments
- [x] One-screen + axe pass in card mode, front and back

**Verification:**
- [x] `npm run e2e:fast`, `npm run check:task` (+ webkit)

**Notes:**
- **Mode setting.** The mode is the `blitzMode` setting (`choice` | `cards`, validated in `core/settings.js`), chosen on the setup screen.
- **Grading.** A card flips to its answer under a ruled line; then "Didn't know" / "Knew it" records with the same Leitner rules and no `confusedWith`.
- **Focus.** Focus restoration after a settings re-render now searches the whole document, so setup controls keep focus.

**Dependencies:** T17
**Files:** `assets/js/blitz-view.js`, `tests/e2e/blitz.spec.mjs`
**Scope:** S

### Task 19: Progress screen — export / import
**Description:** `#/progress`: download `ivrit-progress-YYYY-MM-DD.json`, "copy as text", import from a file or pasted text → `parse` + `merge` → save, with clear localized success/error messages. Imported content goes into the DOM only via `textContent`.

**Acceptance criteria:**
- [x] e2e: progress made in context A, exported, then imported into context B (which has its own progress) → B holds the union, and newer `lastSeen` wins
- [x] Broken JSON, a foreign `app`, or a newer `version` → message shown, local progress byte-identical
- [x] `#/progress` one-screen + axe in both themes

**Verification:**
- [x] `npm run e2e:fast` (`progress.spec.mjs`), `npm run check:task` (+ webkit; 339 e2e across three projects)

**Notes:**
- **Screen.** A summary (practised / learned = box 4–5). Export offers "Download file" (`ivrit-progress-YYYY-MM-DD.json`, local date) and "Copy as text" (Clipboard API, with a clear fallback message). Import takes pasted text or a chosen file (the file wins), then `parse` + `merge` + save.
- **Messages.** Each parse error has a plain message that adds "Progress on this device is unchanged".
- **Entry point.** The ⚙ menu has a "Progress & backup" link. The screen is capped at 40 rem on wide screens.
- **Tests.** Copying is tested with a stubbed `navigator.clipboard`, so it runs in WebKit too. A file import is tested with `setInputFiles`, and nothing empty is accepted.

**Dependencies:** T15, T17
**Files:** `assets/js/ui/progress-screen.js`, `assets/js/main.js`, `assets/js/core/i18n.js`, `tests/e2e/progress.spec.mjs`
**Scope:** M

### Checkpoint: Training loop
- [ ] `npm run check:task` green. Core coverage ≥ 90/80/90
- [ ] Human does a Blitz session on the phone, exports, and imports on the laptop
- [ ] Review before shipping

---

## Phase 5: Anki & ship

### Task 20: Anki TSV export
**Description:** Pure `anki.js` `toTsv(section, lang)` follows the SPEC format (headers `#separator:tab`, `#html:false`, `#tags column:3`; front `he`; back `translit — en / ru`; tags `ivrit::<section> ivrit::<tab>`; tabs/newlines → space). A download button in the cheatsheet header saves `ivrit-<section>.tsv`.

**Acceptance criteria:**
- [x] Unit tests: headers, escaping, tags (incl. week tabs). *RU is a required field, so the back is always `translit — en / ru`*
- [x] e2e: clicking the button downloads `ivrit-<section>.tsv` (every section) whose first line is `#separator:tab`, one 3-column row per entry

**Verification:**
- [x] `node --test tests/unit/anki.test.mjs`, `npm run e2e:fast`, `npm run check:task` (+ webkit; 360 e2e across three projects)
- [ ] Manual (once): import into Anki with no edits (Success Criterion 6). **Needs the human with Anki installed**

**Notes:** The "Anki" button sits in the section bar next to Blitz and exports the whole section, weeks included. `downloadFile` moved to `views/dom.js` and is shared with the progress export.

**Dependencies:** T3, T6
**Files:** `assets/js/core/anki.js`, `tests/unit/anki.test.mjs`, `assets/js/ui/tabs.js` or header module, `tests/e2e/anki.spec.mjs`
**Scope:** S

### Task 21: Release readiness
**Description:** Run the full bar locally, finish the README (weekly-update workflow: give the agent the SPEC Data Contract + summary → `data/weeks/<date>.json` → `node scripts/validate.mjs` → `check:task` → commit), and confirm every SPEC Success Criterion except publishing. **Then ask** before `git push`, enabling Pages and any domain.

**Acceptance criteria:**
- [x] `npm run check:full` green (webkit 390×664, Semgrep 0 ERROR, osv-scanner clean)
- [x] First load ≤ 200 KB and fonts ≤ 60 KB, as reported by the e2e
- [ ] After approved push: CI green, site live at `https://yinon-mitin.github.io/ivrit-studio/`, opened on iOS Safari and Android Chrome

**Verification:**
- [x] `npm run check:full` (93 s: 142 unit, 240 chromium + 120 webkit e2e, Semgrep clean, osv-scanner no issues)
- [ ] Manual: phone check post-deploy, Anki import

**Notes:**
- **Weight measurement changed.** The first-load test now counts text responses gzipped, as GitHub Pages serves them; woff2 counts as is. Home: 98.6 KB transferred (189 KB uncompressed). The old raw measurement would have failed CI after 2–3 weekly data updates, though phones download ~2 KB per week. The threshold (200 KB) and CONSTRAINTS.md are unchanged; this is the user's call to revert.
- **README.** Covers use, adding a week (data only), checking nikud and publishing.
- **Awaiting the user.** `git push` and enabling Pages (SPEC: ask first).

**Dependencies:** T1–T20
**Files:** `README.md`
**Scope:** S

### Checkpoint: MVP complete
- [ ] All SPEC Success Criteria 1–9 met
- [ ] Remaining `verified: false` count handed to the human for nikud review
