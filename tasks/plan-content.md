# Implementation Plan: Ivrit Studio — new lessons (grammar, phrases, everyday words)

Written 2026-10-21, **separate from `tasks/plan.md` and `tasks/plan-next.md`**, which still have open work (second cursive, release, Checkpoints B–D; T18 service worker, Checkpoints F/G). Task list: `tasks/todo-content.md`. Task numbers continue from 21.

## Overview
The owner asked for 12 groups of material (2026-10-21):
1. Possession: whose is it, `של …`, `של אני → שלי`, `הספר` = "the book".
2. Where from / to / on / above / under.
3. Infinitives and their logic on a few simple examples.
4. Objects: computer, notebook, letter, book, pen, pencil and so on.
5. Animals.
6. Husband, wife, partner, friend, neighbour, girlfriend/boyfriend, family ties.
7. Phrases: the market, getting acquainted (how long, where you live, work, hobbies, name, how are you), a courier (floor, building, door, open/closed, intercom code, up/down, order), neighbours.
8. The home: rooms, household things, MAMAD and its kinds.
9. Kitchen things.
10. Fruit and vegetables.
11. Verb forms: "she writes", "they read", "he reads".

Almost all of it is **content in `data/`** (SPEC: "content updates touch only `data/`"). No new code is planned. The shape of every item already exists: `list` view, groups, `emoji`, `forms` (ms/fs/mp/fp, a table under the entry), `related`, `note`.

## Decisions (from the owner, 2026-10-21)
- **Plan files:** new `plan-content.md` / `todo-content.md`; old plans untouched.
- **Parts:** a **new part "Around us" / «Вокруг нас»** (`around`) for objects, animals, home, kitchen, fruit and vegetables. Family stays in Vocabulary and gets the new partner/relative words. Phrases and Grammar parts grow by sections.
- **Verb forms:** **present tense only**, as ms/fs/mp/fp `forms` (what the site already renders). Past and future by person need a new "person × tense" table (new view, schema and tests; "ask first" in SPEC) and is a backlog item, not in this plan.

## Mapping the 12 groups to the structure
| Request | Part | Section id | Action |
|---|---|---|---|
| Verb forms (she writes, they read) | Grammar | `verbs` | new |
| Possession, `של`, the book | Grammar | `possession` | new |
| From / to / on / over / under | Grammar | `places` | new |
| Infinitives | Grammar | `infinitives` | new |
| Getting acquainted | Phrases | `acquaintance` | new (only questions `greetings` lacks) |
| Market | Phrases | `market` | new |
| Courier | Phrases | `courier` | new |
| Neighbours | Phrases | `neighbours` | new |
| Objects | Around us (new part) | `things` | new |
| Animals | Around us | `animals` | new |
| Rooms, home items, MAMAD | Around us | `home` | new |
| Kitchen | Around us | `kitchen` | new |
| Fruit and vegetables | Around us | `produce` | new |
| Husband, wife, partner, girlfriend, relatives | Vocabulary | `family` | **extend** two groups, no renames |

## Dependency Graph
```
data/index.json + SPEC Data Contract (already in place)
      │
      ├── Grammar: T21 verbs ─ T22 possession ─ T23 places ─ T24 infinitives   (independent of each other)
      │        T21 first: it proves the forms table with real verbs and fixes the pronoun list the rest refer to
      │
      ├── Phrases: T25 acquaintance ─ T26 market ─ T27 courier ─ T28 neighbours (independent)
      │
      └── Around us: T29 part + things   (creates the part; everything below needs it)
               ├── T30 animals
               ├── T31 home
               ├── T32 kitchen
               └── T33 produce
      T34 family extension (independent)
      T35 release (needs all)
```
No code dependency exists between content tasks. The order is by risk: new patterns first (verbs with forms), then the rest.

## Architecture Decisions
- **One section = one file = one vertical slice.** `data/sections/<id>.json` + its id in a part of `data/index.json` + a unit/e2e run. The existing generic tests cover it: `tests/unit/data.test.mjs` (validator), `cheatsheet.spec` (every group renders all its entries), `shell.spec` (one contents link per section), axe and overflow at 3 viewports, `flow-toc`/`page-bar` on every part. No test is written per section; the check is that the suite stays green.
- **No duplicates across sections.** `greetings`, `gender-number`, `family`, `vocab` already hold some requested words (name, where from, where you live, how are you, friend, neighbour, `lomed`, `gar`, `oved`, `medaber`). New sections add only what is missing and point to the old entry in a `note` where a learner would look for it. A one-off script lists identical `he` across sections before each commit.
- **Accuracy is the real risk, not code.** Every entry is `verified: false` (only the owner sets `true`, SPEC). Rules in every task: nikud on the full form; `plain` only where ktiv male differs from `stripNikud(he)`; transliteration by the SPEC table (ח/כ→`kh`, צ→`tz`, ש→`sh`, ג׳→`j`, צ׳→`ch`, ז׳→`zh`); the gender of nouns and verbs goes into `en`/`ru` in brackets like `(m.)`/`(ж.)`, as the site does now; spoken Israeli Hebrew, not formal. Batches stay ≤ ~25 entries per commit so the owner can skim and check with Dicta.
- **Emoji only when unambiguous** (animals, fruit, vegetables, some kitchen/home items). No emoji beats a wrong one.
- **Grouping by use, not by alphabet**, so one screen teaches one situation (`courier`: arriving / the building / the door / saying you are outside).
- **Search is free.** `searchKey` already ignores punctuation and nikud; every new entry's `en`, `ru`, `translit` and `he` are searchable. A task adds a search e2e only if it introduces a new kind of query (none expected).
- **Weight and time.** First load reads `index.json` + one part; "Around us" is its own part so Vocabulary and Grammar do not become heavy. Measured at T35 with `scripts/measure-perf.mjs` (first load ≤ 200 KB; part JSON gzip reported). `check:task` budget is ≤ 90 s; it is timed after T28 and T33 because `cheatsheet.spec` iterates every group.

## Task List

### Phase 8: Grammar
- [x] Task 21: Verb forms in the present tense (`verbs`)
- [x] Task 22: Possession and "the" (`possession`)
- [x] Task 23: Where from, where to, on, over, under (`places`)
- [x] Task 24: Infinitives (`infinitives`)

### Checkpoint H: Grammar
- [ ] `npm run check:task` green; Grammar part on phone and laptop (screenshots)
- [ ] Owner skims the four sections, checks nikud with Dicta if wanted, says which patterns to change before more content follows

### Phase 9: Phrases
- [x] Task 25: Getting acquainted (`acquaintance`)
- [x] Task 26: At the market (`market`)
- [x] Task 27: With a courier (`courier`)
- [x] Task 28: With neighbours (`neighbours`)

### Checkpoint I: Phrases
- [ ] `npm run check:task` green and its duration noted (≤ 90 s)
- [ ] Owner skims the four sections

### Phase 10: Around us
- [x] Task 29: New part "Around us" with Objects (`things`)
- [x] Task 30: Animals (`animals`)
- [x] Task 31: The home: rooms, things, MAMAD (`home`)
- [ ] Task 32: Kitchen (`kitchen`)
- [ ] Task 33: Fruit and vegetables (`produce`)
- [ ] Task 34: Partners and relatives in Family (`family`, extended)

### Checkpoint J: Everything
- [ ] `npm run check:full` green; `check:task` duration; first-load weight; part JSON size
- [ ] Owner skims Around us and Family

### Phase 11: Release
- [ ] Task 35: README/SPEC lines, full check, push, live check

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Wrong nikud, gender or meaning in Hebrew written by an AI | High (a learning tool that teaches mistakes) | All `verified: false`; small batches; fresh-context reviewer pass on each phase's data (not a replacement for the owner); owner check with Dicta at Checkpoints H–J; the validator reports the unverified count |
| Words that look alike but mean different things (`חבר` friend/boyfriend, `מכתב` letter vs `אות` letter of the alphabet, `ספר` book/haircut) | Medium | `note` on those entries in both languages |
| MAMAD kinds are written from general knowledge | Medium | List the four I'd write (ממ"ד dwelling, ממ"ק floor, ממ"מ institution, מקלט shelter) in the task; owner confirms the meanings at Checkpoint J before they are pushed |
| Gershayim in `ממ"ד` break normalisation or search | Low | `stripNikud` keeps U+05F4; add a search test only if "ממד" without the mark should also match (decide in T31; then it is a `core/search.js` change with a unit test) |
| Parts get too long (flowing titles, ruler, page bar) | Medium | New part, ≤ 5 sections in it; `flow-toc` and `page-bar` specs run over every part and stay green |
| e2e time grows past 90 s | Low | Measure after T28 and T33; if over, shard by project or ask to raise the budget (CONSTRAINTS.md "ask first"; no edit without approval) |
| Duplicate content between old and new sections | Low | Duplicate-`he` script before each commit; notes point to the old entry |
| Pasted nikud from sources with different spelling rules | Low | Spoken-Hebrew forms; `plain` per SPEC only when it differs |

## Open Questions
- MAMAD list: exactly which kinds does the teacher use? Default: the four above.
- Animals/produce: any words the teacher already gave? Default: the ~25–40 most common in Israel.
- Should "the book" (`הספר`) be a separate Grammar note on the definite article `ה-` (no indefinite article in Hebrew), or only inside `possession`? Default: a group in `possession`.
