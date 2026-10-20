# Constraints

Last reviewed: 2026-10-20 by @yinon-mitin

The quality bar for Ivrit Studio. `SPEC.md` says what to build; this file says what "good enough to commit" means. Failing checks **block** — a task is not done and nothing is committed until `npm run check:task` is green. This file is the canonical source; the `package.json` scripts mirror it.

## Floor (always enforced)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `istanbul ignore`, `c8 ignore`, `node:coverage ignore`, `nosemgrep`, `gitleaks:allow`
- No unfinished work: `throw new Error('Not implemented')`, empty `catch {}`, `TODO`/`FIXME` in code
- No skipped, focused or deleted tests: `.skip`, `.todo`, `.only`, `{ skip: true }`, removed assertions
- No secrets in source
- This file does not get weakened to make a change pass

Checked by `node scripts/floor-guard.mjs` (diff against `origin/main`, or everything before the first push). Exit 0 clean, 1 violation, 2 could not run — a 2 is never a pass.

## Enforced with numbers

| Dimension | Rule | Why this number | Checked by | Runs at |
|-----------|------|-----------------|-----------|---------|
| Floor | Zero floor violations | The cheap roads to green are what agents take | `node scripts/floor-guard.mjs` | every edit |
| Secrets | Zero findings | Public repo: one leaked key is permanent | `gitleaks dir . --redact --no-banner --config .gitleaks.toml` (CI: `gitleaks git`, full history) | every edit, CI |
| Coverage: core lines | ≥ 90% of lines in `assets/js/core/` | Core is small pure logic (routing, search, nikud); untested lines there corrupt progress or teach wrong reading | `npm run test:coverage` | task end, CI |
| Coverage: core branches | ≥ 80% of branches in `assets/js/core/` | Edge cases (bad import, version mismatch) live in branches | `npm run test:coverage` | task end, CI |
| Coverage: core functions | ≥ 90% of functions in `assets/js/core/` | Every exported helper has a caller in a test | `npm run test:coverage` | task end, CI |
| Coverage: changed lines | ≥ 80% of changed lines in `assets/js/core/` | Forces a test with each change, allows a config line | `node scripts/diff-coverage.mjs` (diff-cover vs `origin/main`) | task end, CI (PR) |
| No horizontal overflow | 0 px horizontal overflow per screen at 360×640, 390×664, 1280×720 (pages scroll vertically) | A cheatsheet scrolls down, never sideways; sideways scroll on a phone hides content | Playwright `tests/e2e/` (`npm run e2e:fast`; webkit in `check:full`) | task end, CI |
| Accessibility | Zero critical or serious axe violations (wcag2a, wcag2aa, wcag21aa) in both themes | External WCAG check; covers contrast of light and dark | `@axe-core/playwright` inside `tests/e2e/` | task end, CI |
| Page weight | First load ≤ 200 KB transferred | Phone users on mobile data; the site is HTML + JS + JSON + 2 fonts | Playwright: sum of response sizes | task end, CI |
| Fonts | Each `woff2` ≤ 60 KB | Subset to Hebrew + Latin + punctuation keeps fonts small | Playwright: font response sizes | task end, CI |
| External requests | Zero requests to any origin other than the site | No CDN, analytics or tracking (SPEC Boundaries) | Playwright: request log | task end, CI |
| Security: code | Zero ERROR findings; no HTML sinks (`innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`) in `assets/js/` | Search input is user-supplied; DOM is built with `createElement`/`textContent` | `pipx run semgrep scan --config p/javascript --config .semgrep.yml --error --metrics=off` | CI, `check:full` |
| Security: deps | Nothing at high or above | Below that is mostly noise; only dev dependencies exist | `osv-scanner scan source -L package-lock.json` (the only lockfile; a missing file fails the check) | CI, `check:full` |

External opinions in this bar (not judged by our own tests): axe-core, gitleaks, Semgrep, osv-scanner.

### Activated by the task that creates them
These rows have their tool wired but nothing to run yet. The task that creates the code must add the test in the same change.

| Rule | Activated by | Check |
|------|--------------|-------|
| Data valid: every `data/**/*.json` passes the SPEC validator | `content-schema` | `tests/unit/data.test.mjs` runs `validateAll('data')` (part of `npm run test:coverage`); `node scripts/validate.mjs` for manual runs |
| No horizontal overflow, accessibility, weight, fonts, external requests | `app-shell` | `tests/e2e/*.spec.mjs` |

## Where each check runs

| Stage | Command | What runs | Budget |
|-------|---------|-----------|--------|
| Edit loop | `npm run check:fast` | floor guard, gitleaks | < 5 s |
| Task end / before commit | `npm run check:task` (= `npm run check`) | fast + unit tests with coverage thresholds + changed-line coverage + e2e (chromium phone + laptop, axe) | ≤ 90 s |
| Before push / CI | `npm run check:full` | task + e2e webkit + Semgrep + osv-scanner; CI also scans full git history for secrets | minutes |

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Entries with `verified: false` | 0 (no data yet) | reported by the validator; not a gate — new content starts unverified |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|

New rows need the owner's approval in the conversation and an expiry ≤ 90 days.

Closed:
- E1 (2026-10-20 to 2026-10-20): tests and the "One screen" rule removed with Blitz, progress, Anki and weeks in the pivot to a cheatsheet (`tasks/plan.md` Tasks 1–9). Closed when that work was pushed (`64e6680`); owner @yinon-mitin.
