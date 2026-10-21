# Performance baseline (Task 19)

Taken 2026-10-21 on commit `84318f1` (after the install banner), by `node scripts/measure-perf.mjs 5`:
Chromium through CDP throttling, a throwaway local server with gzip and `cache-control: max-age=600` (what GitHub Pages sends), every run cold (fresh context), medians of 5. Rerun the same command to compare; differences under ~10% are noise on a laptop.

Profiles: **phone** 360×640, CPU 4x slower, 1.6 Mbps, 150 ms. **laptop** 1280×720, no CPU slowdown, 10 Mbps, 40 ms.
"Chain" = the longest run of requests where each was started by the one before (a proxy for sequential round trips). "App ready" = `#app[data-ready="true"]`.

## Numbers

### phone

| Scenario | FCP ms | LCP ms | App ready ms | CLS | Long tasks ms | Requests | KB | Chain |
|---|---|---|---|---|---|---|---|---|
| load `#/` | 584 | 1828 | 2158 | 0 | 92 | 42 | 115.3 | 5 |
| load `#/words` | 596 | 1768 | 2152 | 0 | 183 | 37 | 110 | 5 |

- Nikud toggle on `#/words` (click to repainted): **84 ms**.
- Scroll `#/words` top to bottom (60 frames): worst frame **17 ms**, frames over 50 ms **0**; script 38 ms, layout 33 ms, style 51 ms in total.

### laptop

| Scenario | FCP ms | LCP ms | App ready ms | CLS | Long tasks ms | Requests | KB | Chain |
|---|---|---|---|---|---|---|---|---|
| load `#/` | 140 | 488 | 552 | 0.002 | 0 | 42 | 115.3 | 5 |
| load `#/words` | 140 | 488 | 482 | 0.003 | 0 | 37 | 110 | 5 |

- Nikud toggle on `#/words`: **30 ms**. Scroll `#/words`: worst frame 17 ms, none over 50 ms.

## What the numbers say

1. **Loading is the weak spot; interaction is not.** The toggle (84 ms on a throttled phone) and a scroll through the longest part (no frame over 17 ms) are fine. `content-visibility` and any work on the re-render or the scroll handlers would fix nothing measurable: **not worth doing**.
2. **LCP is three times FCP on the phone (1.8 s vs 0.6 s).** The page shows its frame at once and then waits for content: `index.html` → `main.js` → its imports (about 20 modules, three levels deep) → `data/index.json` → the section files → render. Five sequential steps at 150 ms each, before any byte transfer time.
3. **`#/` fetches all 11 section files** (42 requests in total) just to show titles, icons and entry counts. They go out in parallel, so they cost one step, not eleven, but they start only after `index.json`.
4. Weight is fine (110–115 KB for the whole page, gzipped, 200 KB budget) and CLS is 0 to 0.003.

## Ranked, with the number each should move

| # | Change | Moves | Expected |
|---|---|---|---|
| 1 | `<link rel="modulepreload">` for the static import graph, so the 20 modules are requested together with `main.js` | Chain 5 → 3, phone LCP | −300 to −450 ms (two saved 150 ms steps) |
| 2 | `<link rel="preload" as="fetch" crossorigin href="data/index.json">`, so it is requested with the modules, not after them | Chain, phone LCP | −150 ms |
| 3 | Preload the section files too (all 11, about 20 KB gzipped) | Chain 3 → 2 for `#/` and every part | −150 ms; costs ~10 KB more on part pages, so only keep it if the measured gain is clear |
| 4 | `content-visibility: auto` on sections | none (no scroll or toggle problem) | **skip** |

Items 1–3 are Task 20. Each one is measured with this script before it is kept.

## After Task 20 (same script, same profiles, medians of 5)

| Variant | phone `#/` LCP / ready | phone `#/words` LCP / ready | laptop `#/` LCP | laptop `#/words` LCP | Chain |
|---|---|---|---|---|---|
| Baseline (`84318f1`) | 1828 / 2158 | 1768 / 2152 | 488 | 488 | 5 |
| + `modulepreload` for the 26 modules | 1772 / 2121 | 1700 / 2094 | 456 | 444 | 3 |
| + `preload` of `data/index.json` | 1716 / 2112 | 1672 / 1680 | 452 | 448 | 3 |

What was kept and why:
- **`modulepreload` for all 26 modules: kept.** Chain 5 → 3, LCP −56 to −68 ms on the phone and −32 to −44 ms on the laptop. Less than the −300 ms I projected: at 1.6 Mbps the 115 KB itself takes ~0.6 s, so the saved round trips are only part of the wait.
- **`preload` of `data/index.json`: dropped.** A further −28 to −56 ms on the phone and nothing on the laptop is inside run-to-run noise, and WebKit fetches the file twice (it does not match `as=fetch` to `fetch()`). A unit test now keeps it out.
- **Section files preloaded: not done.** The ones needed depend on the route (`#/` all 11, a part page its own); inline scripts are blocked by the CSP, so a route-aware preload is not possible without more machinery, and preloading all 11 costs ~17 of ~20 KB on a part page for at most one saved step. Ask the owner before touching the data layout (e.g. one combined file per part).
- **`content-visibility`: skipped,** as the baseline said (nothing to fix).

How the hints are guarded: `tests/unit/preload.test.mjs` compares the `modulepreload` list in `index.html` with the real import graph of `main.js` (a new module that is not listed loses the speed-up; a removed one would 404). `tests/e2e/preload.spec.mjs` checks that no file is requested twice and no preload warning appears (it fails for a classic `preload as=script` of a module, which fetches it twice). When a module is added, run the unit test and add its line.

## Limits of these numbers
- The local server is Node `http` (HTTP/1.1, six connections per host), so 42 requests queue. GitHub Pages speaks h2/h3: the absolute times and the size of the gains will differ there. Treat the numbers as a comparison between variants, not as live timings.
- Every run is cold. Repeat visits (a hit within the 10-minute cache, or revalidation after it) are not measured; a service worker (Task 18, owner-gated) is the lever for those.
- `gveret-levin.woff2` is not preloaded; CLS is 0 to 0.003 with `font-display: swap`, so no action.
