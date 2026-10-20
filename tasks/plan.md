# Implementation Plan: Ivrit Studio — Cheatsheet Redesign

Previous plan (MVP: trainer + one-screen cheatsheet): `tasks/archive/mvp-plan.md`, `tasks/archive/mvp-todo.md`.

## Overview
Turn Ivrit Studio from a one-screen trainer into a modern **web cheatsheet** in the "typographic reference" style (variant A). The site loses Blitz, progress with export/import, Anki export, weekly data files and the one-screen rule. In their place come scrollable thematic pages, search, a "hide translations" self-check mode, and a print stylesheet. Translations are English by default, with one switch to Russian (interface and translations together). Static, zero runtime dependencies and no build step stay as they are. Detailed tasks: `tasks/todo.md`.

Decided with the owner (2026-10-20): the feature table, variant A, EN-first with an RU switch, thematic parts instead of one page or a page per section, current fonts (Heebo + Gveret Levin, no new downloads), exception E1 plus one push after Phase 1, and archiving the MVP plan.

## Target structure
```
#/                 Contents: the parts, each listing its sections (typographic table of contents)
#/reading          Reading:  alphabet (letters · finals & variants · print over cursive), nikud, geresh
#/phrases          Phrases:  greetings & small talk, question words
#/words            Words:    vocab, countries & languages
#/grammar          Grammar:  gender & number
#/<part>/<section> the same page, scrolled to the section (anchor)
```
On each part page every section is a heading and every former tab is a subheading. The page scrolls naturally. A sticky header holds the part navigation, search, and the Nikud · Hide · EN/RU · theme controls.

## Dependency Graph
```
SPEC.md + CONSTRAINTS.md (new contract, exception E1)
        │
        ├── remove Blitz / progress / Anki (code + tests + strings)
        ├── remove weeks (data migration → sections; content.js, schema.js)
        └── drop one-screen (CSS flow, groups instead of tabs, overflow-x test only)
                    │
              ── push (floor-guard findings approved) ──
                    │
        parts in index.json + validator + router + contents page
                    │
        design tokens + shell (variant A) ── settings: lang en|ru, nikud, theme, hide
                    │
        ┌───────────┴───────────┐
   reading views           words / phrases views
   (letters, rows,         (dictionary list, flags + languages,
    nikud & geresh tables)  forms when present)
                    │
        search (core filter + UI) · hide-translations · print CSS
                    │
                README, check:full, push
```

## Architecture Decisions
- **Contract first.** `SPEC.md` and `CONSTRAINTS.md` are rewritten before any code (Task 1). The owner reviews the diff. Code follows the new contract.
- **One red window, made visible.** Removing features deletes tests and the "One screen" rule, and the floor guard flags exactly that (`test-deleted`, `assertion-removed`, `rule-removed`, `new-exception`). Exception **E1** in `CONSTRAINTS.md` records the owner's approval, scoped to Phase 1 paths, with an expiry date. All removals happen in Phase 1. At the checkpoint the agent shows the full guard output, and with the owner's "yes" pushes once. CI's floor-guard step fails on that one push, as designed. From Phase 2 on, every check is green again. The guard is not edited.
- **Remove before redesign.** Removal goes first so that the new layout is not fighting one-screen e2e tests or Blitz routes.
- **`tabs` → `groups`.** Without tabs the field names lie, so `tabs`/`tab` become `groups`/`group` (subheadings). Ids of entries never change. The 14/24-per-tab limit goes away.
- **Parts live in `data/index.json`.** `{ "parts": [{ "id", "title": {en, ru}, "sections": [...] }] }`. The validator checks that every section file belongs to exactly one part. Adding a section stays data-only.
- **One language switch.** Settings become `{ theme, nikud, lang: 'en'|'ru', hide }`. `lang` drives both the interface and the translation shown (en by default, not taken from `navigator.language`). Old stored settings fall back field by field, as `parseSettings` already does.
- **Pure logic in `core/`, test first.** New pure functions are `partOf`/`resolveRoute` (content.js) and `matchEntry`/`searchSections` (new `core/search.js`, nikud-insensitive via `stripNikud`, matching he/plain/translit/en/ru). Coverage thresholds are unchanged.
- **Variant A design system** in `app.css` tokens: warm paper background and ink text (light), deep warm-dark (dark), one accent, hairline rules instead of bordered cards, large Hebrew. Latin headings use a system serif stack (`Iowan Old Style, Charter, Georgia, 'Noto Serif', serif`), so nothing new downloads. The interface stays in Heebo.
- **What stays:** no build, no runtime deps, CSP, `createElement`/`textContent` only, ≤ 200 KB first load, ≤ 60 KB per font, zero external requests, axe in both themes, `storage.js` for settings.

## Task List

### Phase 1: New contract and removal
- [x] Task 1: Rewrite SPEC.md and CONSTRAINTS.md for the cheatsheet (plus exception E1)
- [x] Task 2: Remove Blitz, progress and Anki
- [x] Task 3: Fold weeks into sections and remove the weeks mechanism
- [x] Task 4: Drop one-screen: scrolling sections, groups instead of tabs

### Checkpoint 1: Contract and removal
- [ ] `npm run check:task` green except the floor guard; guard output equals the E1 list
- [ ] Owner approves → push (CI floor-guard step red once, everything else green)

### Phase 2: Structure and design
- [x] Task 5: Thematic parts: index.json, validator, router, contents page
- [x] Task 6: Variant A design tokens and the new shell (header, part navigation)
- [ ] Task 7: Settings: one EN/RU switch, nikud, theme
- [ ] Task 8: Reading views: letters, print over cursive, nikud and geresh tables
- [ ] Task 9: Dictionary views: phrases, words, countries, gender & number

### Checkpoint 2: Design review
- [ ] `npm run check:task` green
- [ ] Owner reviews screenshots: phone 390×664 and laptop 1280×720, light and dark, every part

### Phase 3: Cheatsheet tools
- [ ] Task 10: Search across all sections
- [ ] Task 11: Hide-translations self-check mode
- [ ] Task 12: Print stylesheet (A4)
- [ ] Task 13: README, cleanup, release

### Checkpoint 3: Complete
- [ ] `npm run check:full` green, E1 marked closed
- [ ] Owner opens the site on a real phone; push with approval

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Floor guard red during Phase 1 is mistaken for real regressions | Med | E1 lists the exact paths. The agent diffs guard output against E1 before asking to push. Any finding outside E1 is a real problem. |
| Removing week merging breaks entries' ids or section membership | Med | Data migration is a separate commit. `data.test.mjs` plus a one-off count check (same ids, same totals: 171) |
| Variant A still looks "generic" | High | Checkpoint 2 is a human screenshot review before tools are built on top. Tokens are centralized in `app.css`, so a retune is cheap. |
| Search on every keystroke is slow on phones | Low | ~170 entries, pre-stripped nikud index built once. Measured in e2e at 360 px. |
| axe contrast fails on warm paper palette | Med | Contrast ratios are computed when the tokens are picked (Task 6), and axe runs in both themes. |
| Old bookmarks `#/alphabet`, `#/countries/eu-1`, `#/x/blitz` | Low | `resolveRoute` maps a known section id to its part and anchor. Anything else goes to contents. |

## Open Questions
- Content: there are no real greetings yet (hello, bye, thanks). The current "greetings" are small-talk questions. Should a "Greetings" group be added in Phase 3 (data only, `verified: false`)?
- Are `vocab` (13 words of week 1) and `gender-number` worth separate pages, or should the "Grammar" part merge into "Words" until there is more grammar?
