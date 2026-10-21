# Ivrit Studio — Reading line at screen centre, install as an app, GitHub link, performance — Tasks

Plan and decisions: `tasks/plan-next.md`. Older open work stays in `tasks/plan.md` and `tasks/todo.md`. Contract: `SPEC.md`. Quality bar: `CONSTRAINTS.md`.

Every task's Definition of Done: `npm run check:fast` after edits, `npm run check:task` green before each commit, test written before core code, no floor violations (never delete or loosen a test; a changed fixture is fine, a removed assertion is not). Data and code go in separate commits. SPEC is updated in the same task when behaviour changes. `git push` only with the owner's approval.

---

## Phase 6: Quick fixes

### Task 14: Titles switch at the centre of the screen (laptop)
**Description:** On a laptop the flowing section titles make a section "current" when its top passes the line just under the sticky bar (`landing() + 8`). Move that switch to the vertical centre of the viewport. A pure `readingLine(viewportHeight, stickyHeight, centred)` in `core/scroll.js` returns the line; `main.js` `updatePosition` uses it when the flowing titles are active (≥ 72rem, part page with 2+ sections) and keeps today's line on phones and narrow windows. The page-bar label and the ruler label use the same line so the three never disagree. At the very end of the page the last section counts as being read, so a short last section still lights up.

**Acceptance criteria:**
- [x] Unit (`scroll.test.mjs`): `readingLine` returns half the viewport when centred and the old line otherwise; the end-of-page rule makes the last anchor current at 100% and does not change earlier positions; existing `currentAnchor` tests untouched
- [x] e2e (1440×900): with a section's top at 60% of the viewport height the previous section is `current`; at 40% the section is `current`; scrolled to the bottom the last title is `current`; the page-bar label and the ruler label name the same section as the current title
- [x] e2e at 360×640 (phone): behaviour unchanged (a section becomes current at the old line)
- [x] Clicking a title still scrolls its section under the bar and that title becomes `current` (including the last, short section)

**Verification:**
- [x] `node --test tests/unit/scroll.test.mjs`
- [x] `npx playwright test tests/e2e/flow-toc.spec.mjs` run 5 times, before and after the change, to see the existing intermittent failure is not made worse
- [x] `npm run check:task`
- [x] Manual: `npm run serve`, scroll a long part on a laptop and watch the switch happen mid-screen (screenshots at 1280 and 1440)

**Dependencies:** None
**Files:** `assets/js/core/scroll.js`, `tests/unit/scroll.test.mjs`, `assets/js/main.js`, `tests/e2e/flow-toc.spec.mjs`, `SPEC.md` (Layout: where the switch happens)
**Scope:** S

### Task 15: Quiet GitHub link at the bottom of the contents page
**Description:** A small footer at the end of the contents page (`#/`) only, not on part pages (owner, 2026-10-21), in muted colour: the GitHub mark and "Source on GitHub" / «Исходный код на GitHub», linking to `https://github.com/yinon-mitin/ivrit-studio` with `target="_blank" rel="noopener noreferrer"`. It is not in the header, so it never competes with search or the toggles. Hidden in print. The mark is an SVG built with DOM calls (no HTML sinks). On laptops it sits inside the content column, clear of the ruler and the flowing titles.

**Acceptance criteria:**
- [x] The link is present on `#/` and absent on part pages and search results, with an accessible name in EN and RU that follows the language switch
- [x] The link target and `rel` are as above; the page makes no request to github.com (a link is not a request)
- [x] No horizontal overflow at 360×640, 390×664 and 1280×720; axe clean in both themes on the contents page (contrast uses `--muted`); not visible in print
- [x] On a laptop it does not run under the ruler or the flowing titles

**Verification:**
- [x] `npm test` (i18n test covers the new strings in both languages)
- [x] `npm run check:task` (quality.spec.mjs covers overflow and axe on every route)
- [x] Manual: footer on a phone and a laptop, light and dark

**Dependencies:** None
**Files:** `assets/js/core/i18n.js`, `assets/js/ui/footer.js` (new), `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/shell.spec.mjs`, `README.md`
**Scope:** S

### Checkpoint E: quick fixes
- [ ] `npm run check:task` green
- [ ] Owner looks at the laptop switch point and the footer (screenshots or `npm run serve`)

---

## Phase 7: Install as an app

### Task 16: The site is installable (manifest, icons, theme colour)
**Description:** Add `manifest.webmanifest` (name "Ivrit Studio", short name, `start_url` and `scope` `./` so it works under `/ivrit-studio/`, `display: standalone`, paper-coloured background and theme, icons 192, 512 and a maskable 512). A dev script `scripts/make-icons.mjs` renders the letter א from the site's own Heebo font on the paper colour in the accent blue into `assets/icons/*.png` (plus 180 px for `apple-touch-icon`) with Playwright, and the PNGs are committed. `index.html` links the manifest and the apple-touch icon, sets `theme-color` for light and dark, and replaces `href="data:,"` with an inline SVG favicon so the page still makes no extra request. SPEC gets the `install` module in the capability map and a line in Success Criteria 8.

**Acceptance criteria:**
- [x] e2e (chromium): `Page.getAppManifest` returns the manifest with no errors and `Page.getInstallabilityErrors` is empty. If an error names the service worker, stop and move Task 18 before Task 17
- [x] The manifest and every icon are same-origin; the external-requests test still passes; first load stays ≤ 200 KB (measured, reported in the task notes)
- [x] Each PNG is ≤ 20 KB; the maskable icon keeps the letter inside the safe zone (visual check of the 4 files)
- [x] The tab icon and the home-screen icon show the letter א; no icon request is made on page load by the browser (Chrome fetches the manifest only)

**Verification:**
- [x] `node scripts/make-icons.mjs` is reproducible (running it twice leaves `git status` clean)
- [x] `npm run check:task`
- [x] Manual: Chrome DevTools → Application → Manifest shows the icons and "installable"

**Dependencies:** None
**Files:** `manifest.webmanifest` (new), `assets/icons/*.png` (new), `scripts/make-icons.mjs` (new), `index.html`, `tests/e2e/installable.spec.mjs` (Chromium only), `tests/unit/manifest.test.mjs`, `SPEC.md`, `README.md`
**Scope:** M

### Task 17: Install prompt on phones (Android button, iOS hint)
**Description:** A small banner at the bottom of the screen on touch phones. On Android/Chrome it listens for `beforeinstallprompt`, keeps the event, and the "Install" button calls `prompt()`; on iOS (no such event) it shows "Tap Share, then Add to Home Screen" with a share glyph drawn in SVG. Pure `core/install.js` decides what to show from (standalone, touch, iOS, can prompt, visit count, first-seen time, dismissed-at, now): shown on the second visit or after 30 s, never in standalone, never within 30 days of a dismissal, never after `appinstalled`. State is stored through `storage.js` and parsed field by field like `settings.js`. Strings in EN and RU. Hidden in print. The banner never covers the sticky header or page bar.

**Acceptance criteria:**
- [x] Unit (`install.test.mjs`): every branch of `installOffer` (standalone, desktop, first visit, second visit, 30 s, snoozed, expired snooze, installed, iOS vs can-prompt); broken or missing stored state falls back to "not seen yet"
- [x] e2e (chromium-phone): a synthetic `beforeinstallprompt` event (with a stubbed `prompt()` and `userChoice`) shows the banner after the second visit; "Install" calls `prompt()`; "Not now" hides it and a reload within 30 days does not show it
- [x] e2e (webkit-iphone): the iOS hint appears under the same timing rules; no button that calls a missing API
- [x] The banner is absent on the laptop projects and in `display-mode: standalone`
- [x] No horizontal overflow at 360×640 and 390×664 with the banner open; axe clean in both themes and both languages; it does not overlap the sticky bar or the Hide toggle

**Verification:**
- [x] `npm test`, then `npm run check:task`, then `npm run e2e:webkit`
- [ ] Manual (Checkpoint F): a real Android phone installs from the banner; a real iPhone follows the hint

**Dependencies:** Task 16
**Files:** `assets/js/core/install.js` (new), `tests/unit/install.test.mjs` (new), `assets/js/ui/install.js` (new), `assets/js/core/i18n.js`, `assets/js/main.js`, `assets/css/app.css`, `tests/e2e/install.spec.mjs` (new), `SPEC.md`
**Scope:** M

### Checkpoint F: install
- [ ] `npm run check:full` green; first-load weight still ≤ 200 KB
- [ ] Owner installs the site on a real Android phone and on a real iPhone; the icon, name and standalone window look right
- [ ] Owner says go or no-go on Task 18

---

## Phase 8: Offline (only after "go")

### Task 18: Service worker: works offline and loads fast on repeat visits
**Description:** `sw.js` at the site root, registered from `main.js` after load. Network-first for `index.html` and `data/` (so a deployed correction shows on the next visit), cache-first for fonts and icons, a versioned cache name that is bumped with each release, and old caches deleted on activate. A small "Updated" or silent refresh path is decided with the owner. Registration is skipped when `serviceWorker` is unavailable. Unregistering is a documented one-liner in the README.

**Acceptance criteria:**
- [ ] e2e: after one visit, `context.setOffline(true)` and a reload still render the contents and a part, with search working
- [ ] e2e: after the cache version changes, the next online visit gets the new `data/` file (no stale lesson)
- [ ] The worker makes no request to another origin; first load stays ≤ 200 KB; the existing offline-unavailable path (private window) still renders the site
- [ ] A deliberately broken `data/` response online does not replace the cached copy

**Verification:**
- [x] `npm run check:full`
- [ ] Manual: airplane mode on a phone after one visit; then a deploy and a visit to see the update

**Dependencies:** Tasks 16 and 17; owner "go"
**Files:** `sw.js` (new), `assets/js/main.js`, `tests/e2e/offline.spec.mjs` (new), `README.md`, `SPEC.md`
**Scope:** M

---

## Phase 9: Performance

### Task 19: Baseline: measure first load, long-page scroll and a settings toggle
**Description:** Measure before changing anything, and write the numbers to `tasks/notes/perf-baseline.md`: request waterfall depth and time to first content on `#/` and `#/reading` with a throttled profile (Playwright CDP network and CPU throttling), LCP and CLS via `PerformanceObserver`, the cost of toggling Nikud on the longest part (INP-style: input to next paint), and scroll handler cost on a long part. Run the `agent-skills:webperf` auditor against the same numbers and record its findings. No production code changes and no new dependencies.

**Acceptance criteria:**
- [x] `tasks/notes/perf-baseline.md` has the numbers above for phone and laptop profiles, how they were taken (so they can be repeated), and a ranked list of what is worth fixing
- [x] Each proposed optimization names the number it should move and by roughly how much

**Verification:**
- [x] The measurement script (kept under `scripts/` or described precisely in the note) can be rerun and gives numbers within noise
- [x] Owner reads the note and picks what goes into Task 20

**Dependencies:** None (best run after Task 17, so the numbers include the new files)
**Files:** `tasks/notes/perf-baseline.md` (new), optionally `scripts/measure-perf.mjs` (new)
**Scope:** S

### Task 20: Optimizations the baseline justifies
**Description:** Only what Task 19 shows is worth it. Likely candidates: `modulepreload` hints for the static import graph plus a `preload` of `data/index.json` (a unit test keeps the hint list equal to the real imports, since there is no build step), and `content-visibility: auto` with `contain-intrinsic-size` on sections of long parts. Each change is its own commit with before/after numbers from Task 19's script.

**Acceptance criteria:**
- [x] Every change improves the number it was proposed for, in the same script and profile; anything that does not is reverted, not kept "just in case"
- [x] Page weight, overflow, axe and external-request checks are unchanged or better; the reader is still kept in place after a settings change on a long page
- [x] If preload hints are added, the unit test fails when a module is added or removed without updating them

**Verification:**
- [x] `npm run check:full`
- [x] The perf script shows before/after in the commit message or in `tasks/notes/perf-baseline.md`

**Dependencies:** Task 19
**Files:** `index.html`, `assets/css/app.css`, `tests/unit/` (hint list test), `tasks/notes/perf-baseline.md`
**Scope:** S–M (size depends on what the baseline shows)

---

## Checkpoint G: complete
- [ ] `npm run check:full` green; CI green on the push; the live site serves the new files (`curl` of `manifest.webmanifest` and `data/…`)
- [ ] README and SPEC describe what shipped
- [ ] Owner picks items from the backlog in `tasks/plan-next.md`, or closes it

## Backlog (not scheduled; owner picks)
- My words: star entries, "starred only" filter, print the starred list
- Hebrew text size (A−/A+)
- Permalink to an entry with a highlight; tap-to-copy Hebrew
- Search: highlight the match, shareable `#/search/<query>`, final letters treated as plain (ך = כ)
- Laptop `j`/`k` for next/previous section; phone back-to-top button
- Print one section instead of the whole part
- CLS/LCP budget in `CONSTRAINTS.md` and e2e ("ask first")
