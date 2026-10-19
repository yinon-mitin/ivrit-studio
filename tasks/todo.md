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
- [ ] Every alphabet tab passes one-screen at 360×640 / 1280×720 with `showRu` on (resolves the SPEC open question about the 24 limit)
- [ ] Hebrew nodes have `lang="he" dir="rtl"`. Cursive glyphs use Gveret Levin (`document.fonts.check`)
- [ ] `content.js` unit tests cover default tab, unknown tab → default, and sections without tabs

**Verification:**
- [ ] `npm test`, `node scripts/validate.mjs`, `npm run e2e:fast`
- [ ] Manual: phone-size screenshot of `#/alphabet` reviewed by a human
- [ ] `npm run check:task` green before each of the two commits

**Dependencies:** T5
**Files:** `assets/js/core/content.js`, `tests/unit/content.test.mjs`, `assets/js/ui/tabs.js`, `assets/js/views/letter-grid.js`, `assets/js/main.js`, `data/sections/alphabet.json`, `data/index.json`
**Scope:** M

### Task 7: "Print over cursive" tab — `letter-rows`
**Description:** `views/letter-rows.js`: a row of print letters directly above the same letters in cursive, for practising cursive reading. Add the alphabet tab per the answer to Open Question 1.

**Acceptance criteria:**
- [ ] `#/alphabet/<rows-tab>` shows every letter print-over-cursive, aligned per column, RTL order
- [ ] One-screen + axe pass on all three viewports (webkit in `check:full`)

**Verification:**
- [ ] `npm run e2e:fast`, `npm run check:task`
- [ ] Manual: compare with the teacher's handwriting (SPEC manual check)

**Dependencies:** T6
**Files:** `assets/js/views/letter-rows.js`, `assets/js/main.js` (view registry), `data/sections/alphabet.json`
**Scope:** S

### Task 8: Settings — theme + interface language
**Description:** `storage.js` (try/catch wrapper with in-memory fallback, key `ivrit-studio:settings`), `core/i18n.js` (UI strings `{ en, ru }`, `pickLang(navigator.language)`, `t(key, lang)`), and header controls for theme `system|light|dark` and UI language. Every UI string goes through i18n.

**Acceptance criteria:**
- [ ] The theme toggle cycles system → light → dark and persists across reload. `prefers-color-scheme` is honoured on `system` (e2e, both schemes) and both themes pass axe
- [ ] UI language defaults from `navigator.language` (ru* → ru, else en), switches every label, and persists
- [ ] With `localStorage` throwing, the site still loads and toggles work for the session (e2e)

**Verification:**
- [ ] `node --test tests/unit/i18n.test.mjs`, `npm run e2e:fast` (`settings.spec.mjs` incl. home screenshots in both themes)
- [ ] `npm run check:task` green

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
- [ ] Three tabs, 36 countries, each tab ≤ 14, valid against the validator
- [ ] Each tab passes one-screen + axe at 360×640 / 1280×720 with `showRu` on
- [ ] Transliteration follows the SPEC rules (kh/tz/sh/j/ch/zh)

**Verification:**
- [ ] `node scripts/validate.mjs` (warning count = 36 unverified), `npm run e2e:fast`, `npm run check:task`

**Dependencies:** T6
**Files:** `assets/js/views/card-grid.js`, `assets/js/main.js`, `data/sections/countries.json`, `data/index.json`
**Scope:** M

### Task 10: Countries part II (data only)
**Description:** Add the Asia (14), Americas (10) and Middle East/Africa/Oceania (13, Israel first) tabs. Spellings follow Hebrew Wikipedia. Nikud is unverified.

**Acceptance criteria:**
- [ ] 6 tabs, about 73 countries total, every tab ≤ 14, Israel first in its tab
- [ ] Validator and one-screen e2e pass with no code change

**Verification:**
- [ ] `node scripts/validate.mjs`, `npm run check:task`

**Dependencies:** T9
**Files:** `data/sections/countries.json`
**Scope:** S

### Task 11: Nikud + RU-translation toggles
**Description:** Header toggles `nikud` (default on) and `showRu` (default off), persisted in settings. Views render via `displayHe`. Sections with `nikudToggle: false` ignore the nikud setting. Extend the harness to check both nikud states.

**Acceptance criteria:**
- [ ] On countries, toggling nikud changes the Hebrew text (`plain` wins when present). On alphabet it changes nothing (e2e)
- [ ] `showRu` adds RU next to EN in every view, and one-screen still passes (densest mode)
- [ ] Both toggles persist across reload

**Verification:**
- [ ] `npm run e2e:fast`, `npm run check:task`

**Dependencies:** T8, T9
**Files:** `assets/js/ui/settings.js`, `assets/js/views/*.js`, `tests/e2e/helpers.mjs`, `tests/e2e/settings.spec.mjs`
**Scope:** M

### Task 12: `table` view + Nikud section
**Description:** `views/table.js` (rows × columns with Hebrew cells). Commit 2: `data/sections/nikud.json`: each vowel sign on an example (בַּ בֶּ בִּ בּוֹ בּוּ בְּ …) with translit, and same-sound pairs (kamatz/patach, segol/tsere) noted. `nikudToggle: false`. Blitz template `syllable-to-reading`.

**Acceptance criteria:**
- [ ] Nikud section on one screen (tabs if > 14), axe clean in both themes
- [ ] Same-sound pairs are visibly grouped and listed as `confusables`

**Verification:**
- [ ] `node scripts/validate.mjs`, `npm run e2e:fast`, `npm run check:task`

**Dependencies:** T6
**Files:** `assets/js/views/table.js`, `assets/js/main.js`, `data/sections/nikud.json`, `data/index.json`
**Scope:** M

### Task 13: Geresh section (data only)
**Description:** `data/sections/geresh.json`: the sound table (`ג׳`=j, `צ׳`=ch, `ז׳`=zh, `וו`=v/w) and example loanwords (`סרג'יו`, `צ'ילה` vs `צ'ילי`, `וודקה`, `וואטסאפ`, `ג'ינס`, `ז'נבה`, `צ'יפס`). Uses an existing view. Blitz template `translit-to-he`.

**Acceptance criteria:**
- [ ] Valid, one screen, axe clean. No code changes
- [ ] Geresh is preserved when nikud is off (covered by T2 rules, spot-checked e2e)

**Verification:**
- [ ] `node scripts/validate.mjs`, `npm run check:task`

**Dependencies:** T11, T12
**Files:** `data/sections/geresh.json`, `data/index.json`
**Scope:** S

### Task 14: Weeks → Vocab section
**Description:** `content.js` `mergeWeeks(sections, weeks)` (pure) appends week items to their section under the auto tab `week-<date>`, and exposes `latestLetters(weeks)`. The loader fetches the weeks listed in `index.json`. The i18n title for week tabs is generated. Commit 2: `data/sections/vocab.json` (empty items) + `data/weeks/2026-10-11.json` derived from the teacher's summary. **Blocked on Open Question 2 for the data commit.**

**Acceptance criteria:**
- [ ] Unit tests: items land in the right section/tab, multiple weeks are ordered by date, `latestLetters` returns the latest week's letters
- [ ] `#/vocab/week-2026-10-11` renders on one screen. Tabs over 14 fail the validator (split guidance in README)
- [ ] The week file was produced using only the SPEC Data Contract + summary, and passes the validator with no code change (Success Criterion 9 dry run)

**Verification:**
- [ ] `npm test`, `node scripts/validate.mjs`, `npm run e2e:fast`, `npm run check:task`

**Dependencies:** T3, T6
**Files:** `assets/js/core/content.js`, `tests/unit/content.test.mjs`, `assets/js/loader.js`, `assets/js/core/i18n.js`, `data/sections/vocab.json`, `data/weeks/2026-10-11.json`, `data/index.json`
**Scope:** M

### Checkpoint: Cheatsheets complete
- [ ] All 5 MVP sections open on one screen at 360×640 / 1280×720 (and webkit 390×664 via `npm run e2e:webkit`)
- [ ] Validator warning count = number of entries awaiting human nikud verification
- [ ] Human review of content before building Blitz

---

## Phase 4: Blitz & progress

### Task 15: `progress.js` — progress model
**Description:** Pure: `emptyProgress()`, `record(progress, key, correct, now, confusedWithId?)` (Leitner: correct → box+1 capped at 5, wrong → box 1, `seen`/`wrong`/`lastSeen`/`confusedWith`), `serialize`, `parse` (rejects foreign `app`, newer `version`, broken JSON with a typed error; migrates older versions), `merge(local, incoming)` (union, newer `lastSeen` wins). `storage.js` gains progress get/set under `ivrit-studio:progress`.

**Acceptance criteria:**
- [ ] Unit tests for every SPEC progress rule, including "rejection leaves local data untouched" and migration from a v0 fixture
- [ ] `merge` is commutative on non-conflicting keys and deterministic on ties
- [ ] Core coverage thresholds still met

**Verification:**
- [ ] `node --test tests/unit/progress.test.mjs`, `npm run check:task`

**Dependencies:** T3
**Files:** `assets/js/core/progress.js`, `tests/unit/progress.test.mjs`, `assets/js/storage.js`
**Scope:** S

### Task 16: `blitz.js` — card selection and distractors
**Description:** Pure, RNG passed in: `cardKeys(section, templates, letters?)`, `buildSession(section, progress, rng, { size: 10, maxNew: 3, letters })` using weights `{0:4,1:16,2:8,3:4,4:2,5:1}`, `fieldValue(entry, field)` for `he|heCursive|translit|meaning|emoji|related.he|forms.*`, `distractors(entry, field, section, progress, rng)` → 3, in priority order: personal `confusedWith` → `confusables` group → same tab → section, with no duplicates or equal display values.

**Acceptance criteria:**
- [ ] Seeded-RNG tests: weights are respected statistically, ≤ 3 new cards, 10 questions (fewer only if the section is smaller)
- [ ] Distractor tests: priority order, no duplicates, the correct answer is always among the 4, and it works when a section has < 4 entries
- [ ] Alphabet with weeks present limits cards to `latestLetters`

**Verification:**
- [ ] `node --test tests/unit/blitz.test.mjs`, `npm run check:task`

**Dependencies:** T14, T15
**Files:** `assets/js/core/blitz.js`, `tests/unit/blitz.test.mjs`
**Scope:** M

### Task 17: Blitz UI — multiple choice
**Description:** `blitz-view.js` at `#/<section>/blitz`: template picker (when the section has several), a 10-question session, 4 options, feedback, results summary. Each answer is recorded via `progress.record` + `storage.js`, and a wrong pick goes to `confusedWith`. Add a "Blitz" entry point to the cheatsheet header.

**Acceptance criteria:**
- [ ] e2e: 10 questions can be completed on alphabet and countries. A deliberate wrong answer shows up in `ivrit-studio:progress` with `box: 1` and `confusedWith`
- [ ] Every section's Blitz route passes one-screen + axe (auto via harness)
- [ ] Works with storage unavailable (progress lives until reload)

**Verification:**
- [ ] `npm run e2e:fast` (`blitz.spec.mjs`), `npm run check:task`

**Dependencies:** T16
**Files:** `assets/js/blitz-view.js`, `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/blitz.spec.mjs`
**Scope:** M

### Task 18: Blitz UI — flashcards
**Description:** Second mode in the same view: show the prompt, tap to flip, then "knew / didn't know". Recorded with the same Leitner rules (no `confusedWith`). Mode choice is remembered in settings.

**Acceptance criteria:**
- [ ] e2e: flip, mark "didn't know" → card `box: 1`. Mark "knew" → box increments
- [ ] One-screen + axe pass in card mode, front and back

**Verification:**
- [ ] `npm run e2e:fast`, `npm run check:task`

**Dependencies:** T17
**Files:** `assets/js/blitz-view.js`, `tests/e2e/blitz.spec.mjs`
**Scope:** S

### Task 19: Progress screen — export / import
**Description:** `#/progress`: download `ivrit-progress-YYYY-MM-DD.json`, "copy as text", import from a file or pasted text → `parse` + `merge` → save, with clear localized success/error messages. Imported content goes into the DOM only via `textContent`.

**Acceptance criteria:**
- [ ] e2e: progress made in context A, exported, then imported into context B (which has its own progress) → B holds the union, and newer `lastSeen` wins
- [ ] Broken JSON, a foreign `app`, or a newer `version` → message shown, local progress byte-identical
- [ ] `#/progress` one-screen + axe in both themes

**Verification:**
- [ ] `npm run e2e:fast` (`progress.spec.mjs`), `npm run check:task`

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
- [ ] Unit tests: headers, escaping, tags (incl. week tabs), and RU appended only when present
- [ ] e2e: clicking the button downloads `ivrit-countries.tsv` whose first line is `#separator:tab`

**Verification:**
- [ ] `node --test tests/unit/anki.test.mjs`, `npm run e2e:fast`, `npm run check:task`
- [ ] Manual (once): import into Anki with no edits (Success Criterion 6)

**Dependencies:** T3, T6
**Files:** `assets/js/core/anki.js`, `tests/unit/anki.test.mjs`, `assets/js/ui/tabs.js` or header module, `tests/e2e/anki.spec.mjs`
**Scope:** S

### Task 21: Release readiness
**Description:** Run the full bar locally, finish the README (weekly-update workflow: give the agent the SPEC Data Contract + summary → `data/weeks/<date>.json` → `node scripts/validate.mjs` → `check:task` → commit), and confirm every SPEC Success Criterion except publishing. **Then ask** before `git push`, enabling Pages and any domain.

**Acceptance criteria:**
- [ ] `npm run check:full` green (webkit 390×664, Semgrep 0 ERROR, osv-scanner clean)
- [ ] First load ≤ 200 KB and fonts ≤ 60 KB, as reported by the e2e
- [ ] After approved push: CI green, site live at `https://yinon-mitin.github.io/ivrit-studio/`, opened on iOS Safari and Android Chrome

**Verification:**
- [ ] `npm run check:full`
- [ ] Manual: phone check post-deploy, Anki import

**Dependencies:** T1–T20
**Files:** `README.md`
**Scope:** S

### Checkpoint: MVP complete
- [ ] All SPEC Success Criteria 1–9 met
- [ ] Remaining `verified: false` count handed to the human for nikud review
