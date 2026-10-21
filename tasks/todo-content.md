# Todo: new lessons (grammar, phrases, everyday words)

Plan: `tasks/plan-content.md`. Separate from `tasks/todo.md` and `tasks/todo-next.md`, which have open items of their own. Numbering continues from 21.

**Rules for every content task** (not repeated below):
- Edit `data/` only (plus `data/index.json` for a new section). Schema: SPEC "Data Contract". Entry ids `<section>.<slug>`, never renamed.
- Every entry `verified: false`; nikud on `he`; `plain` only when it differs from `stripNikud(he)`; transliteration by the SPEC table; genders marked `(m.)`/`(f.)` and `(м.)`/`(ж.)`; both `en` and `ru`.
- Before the commit: `node scripts/validate.mjs`; duplicate-`he` check against all other sections (identical `he` is fine only if the meaning is different and a `note` says so); `npm run check:task` green.
- One commit per task; message `content: <section> …`.

## Phase 8: Grammar

### Task 21: Verb forms in the present tense (`verbs`)
**Description:** The owner's "she writes, they read, he reads". A section of ~12 common verbs, each with `forms` (ms/fs/mp/fp), so the page shows the four-cell table under the verb; plus the personal pronouns the other sections lack and a few whole sentences.
**Groups:** `pronouns` (I m./f., you m./f., he, she, they m./f.; `we`, `you pl.`, `they m.` already exist in `gender-number`, so only the missing ones plus a note pointing there), `present` (write, read, eat, go, say/tell, want, love/like, know, understand, sit, sleep, drink; `lomed`, `gar`, `oved`, `medaber` stay in `gender-number` and are linked by a note), `sentences` (she writes, they read (m.) / (f.), he reads, I eat (m./f.), we go).
**Acceptance criteria:**
- [x] Each verb in `present` has all four `forms`; the `forms` table renders (existing list-features spec) and `related` does not repeat the forms.
- [x] `sentences` shows pronoun + verb in the right gender and number for the three examples the owner named.
- [x] A note on one verb says that in the present tense Hebrew has no "I/you/he" in the verb itself: the pronoun is needed.
**Verification:** [ ] `check:task` green [ ] screenshot of the page on phone: the forms table does not overflow at 360 px.
**Dependencies:** None. **Files:** `data/sections/verbs.json`, `data/index.json`. **Scope:** Medium (content-heavy, no code).
**Outcome:** 27 entries (7 pronouns, 12 verbs with forms, 8 sentences), title shortened to "Verbs" so the page bar does not truncate it. Check green except the floor step (exception E2); all entries `verified: false`.

### Task 22: Possession and "the" (`possession`)
**Description:** "Whose is it?" `של`; `של אני → שלי`; `הספר` = "the book".
**Groups:** `whose` (`של מי?`, `של` + a name: `הספר של דנה`), `mine` (שלי, שלך m./f., שלו, שלה, שלנו, שלכם, שלכן, שלהם, שלהן — with one example each in `note`), `the` (the prefix `ה-`: `ספר` a book → `הספר` the book; Hebrew has no "a"; `הַ` doubles nothing in writing), `examples` (`הספר שלי`, `הכלב של דנה`, `זה שלך?`).
**Acceptance criteria:**
- [x] All ten pronoun forms of `של` are present and the group answers "how do I say 'my book'".
- [x] `ה-` is explained in `note` in both languages in one or two lines; the example pair is book / the book.
- [x] No entry duplicates `gender-number` (`ze`, `zot`).
**Verification:** [ ] `check:task` green. **Dependencies:** None (T21 supplies the pronoun names). **Files:** `data/sections/possession.json`, `data/index.json`. **Scope:** Small–Medium.
**Outcome:** 23 entries: whose, my/your/his… (10 forms of shel), the (ha-), examples.


### Task 23: Where from, where to, on, over, under (`places`)
**Description:** Direction and position: "откуда, куда, на чем-то, над чем-то/под чем-то".
**Groups:** `questions` (מאיפה, לאן; `איפה` already exists as `greetings.eifo`, linked by note), `prefixes` (מ- from, ל- to, ב- in/at, with one example each: `מירושלים`, `לתל אביב`, `בבית`), `position` (על on, מעל above, מתחת under, ליד next to, בין between, לפני before/in front of, אחרי after, מאחורי behind, מול opposite, בתוך inside), `sentences` (`הספר על השולחן`, `החתול מתחת לכיסא`, `אני גר ליד הים`).
**Acceptance criteria:**
- [x] Every preposition has at least one use example; the three prefixes show how the vowel changes in the name (`מִ`/`לְ`/`בְּ`).
- [x] `על`, `מעל`, `מתחת` are shown side by side in one group, in an order the learner reads as a picture (on, above, under).
**Verification:** [ ] `check:task` green. **Dependencies:** None. **Files:** `data/sections/places.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 27 entries: where from/to, prefixes mi/le/be (+ the: me-ha, la, ba), 10 position words, 6 sentences. Hebrew-only spelling check printed and read.


### Task 24: Infinitives (`infinitives`)
**Description:** The logic of the infinitive on a few simple examples, not a full binyan table.
**Groups:** `pattern` (`ל` + root: לכתוב, לקרוא, לדבר, ללמוד, לעבוד, לגור; `note` states the one rule), `irregular` (לאכול, ללכת, לבוא, לדעת, לתת — the ones that break the pattern), `frames` (אני רוצה לאכול, אני אוהב לקרוא, אני צריך ללכת, אפשר לשבת?, אני יכול לעזור).
**Acceptance criteria:**
- [x] The pattern group lets the learner see `ל` + the same letters the present tense shows (links to T21 by `note`).
- [x] Each of the four helper verbs (want, love/like, need, can) has one frame; the infinitive stays unchanged in all of them.
**Verification:** [ ] `check:task` green. **Dependencies:** T21 (verbs to refer to). **Files:** `data/sections/infinitives.json`, `data/index.json`. **Scope:** Small–Medium.
**Outcome:** 17 entries: 6 pattern verbs, 6 irregular, 5 frames with want/love/need/can.


### Checkpoint H: Grammar
- [ ] `npm run check:task` green; the Grammar part (5 sections now) on a phone and a laptop (screenshots), flowing titles still fit
- [ ] Owner skims, adjusts the pattern for the next phases (tone, level of notes, how many examples)

## Phase 9: Phrases

### Task 25: Getting acquainted (`acquaintance`)
**Description:** The questions of a first talk that `greetings` does not have: how long have you been here, what do you do, where do you work, what are you into, how's the family. Name, "how are you", "where are you from", "where do you live" stay in `greetings` (note points there).
**Groups:** `ask` (questions, m. and f. where they differ), `answer` (ready answers: I live in …, I work as …, I study …, I have been here for … months).
**Acceptance criteria:** [ ] Each question has an answer line in `answer`. [ ] No question repeats a `greetings` entry.
**Verification:** [ ] `check:task` green. **Dependencies:** None. **Files:** `data/sections/acquaintance.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 28 entries: 13 questions (m./f. where they differ), 15 answers.


### Task 26: At the market (`market`)
**Description:** Buying, asking the price and haggling a little.
**Groups:** `ask` (how much is it, how much a kilo, what's this, can I taste, is it fresh), `buy` (give me, I'll take, a kilo/half a kilo, a bag, that's all), `pay` (cash/card, change, receipt), `haggle` (too expensive, discount, last price).
**Acceptance criteria:** [ ] Amount words (kilo, half, a bag, a piece) are present. [ ] Numbers are not repeated (refer to `numbers` in a note).
**Verification:** [ ] `check:task` green. **Dependencies:** None. **Files:** `data/sections/market.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 26 entries in 4 groups; amounts (kilo, half, piece, bag) included, numbers referenced not repeated. The page-bar e2e fixture now skips the last section of a part (the end-of-page rule makes its last group current).


### Task 27: With a courier (`courier`)
**Description:** What a delivery person and a resident say to each other.
**Groups:** `arriving` (I'm at the door, I'm downstairs, order for …, which floor, which apartment), `building` (floor, building, entrance, lift/stairs, intercom code, go up, go down), `door` (open, closed, ring, knock, leave at the door), `finish` (thank you, sign here, have a good day).
**Acceptance criteria:** [ ] Floor/building/door/open-closed/code/up-down/order from the owner's list are all present. [ ] Each instruction exists for a man and a woman where the Hebrew differs.
**Verification:** [ ] `check:task` green. **Dependencies:** None. **Files:** `data/sections/courier.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 40 entries; open/closed with forms; each instruction in m. and f. where it differs. Page-bar fixture made robust against short groups.


### Task 28: With neighbours (`neighbours`)
**Description:** Short exchanges with the people next door.
**Groups:** `greet` (neighbour m./f. use `family.shakhen`, the greeting for the stairwell), `asks` (noise, parking, rubbish, a package left with you, can I borrow, building committee), `thanks` (thanks, sorry, no problem).
**Acceptance criteria:** [ ] Polite requests use the form a neighbour actually says (`אפשר …?`, `סליחה, …`). [ ] Does not duplicate T27.
**Verification:** [ ] `check:task` green; **duration noted**. **Dependencies:** None. **Files:** `data/sections/neighbours.json`, `data/index.json`. **Scope:** Small–Medium.
**Outcome:** 21 entries in 3 groups. Fixed a real bug found by the group-link e2e: on a long laptop page the target group moved off screen after the ruler took its room; render() now scrolls to it again.


### Checkpoint I: Phrases
- [ ] `check:task` green and its duration noted (≤ 90 s, else stop and ask)
- [ ] Owner skims the four sections

## Phase 10: Around us

### Task 29: The new part "Around us" with Objects (`things`)
**Description:** Creates part `around` (`Around us` / `Вокруг нас`) in `data/index.json` and its first section: computer, notebook, letter (`מכתב`, with a note: not `אות`, a letter of the alphabet), book, pen, pencil, paper, bag, key, phone, charger, table, chair and similar, ~30 entries in groups (`study`, `carry`, `tech`).
**Acceptance criteria:**
- [x] The part shows in the header nav on a phone (the scrolling row still has no horizontal page scroll) and on a laptop; the contents page lists it; `#/around` works.
- [x] Old URLs of other parts keep working.
- [x] Emoji only where unambiguous.
**Verification:** [ ] `check:task` green [ ] phone nav screenshot at 360 px. **Dependencies:** None. **Files:** `data/sections/things.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** New part around (Around us / Вокруг нас) between Vocabulary and Grammar; things: 27 entries in 3 groups with emoji where clear; table and chair go to home (T31).


### Task 30: Animals (`animals`)
**Groups:** `pets`, `farm`, `wild`, `birds-insects`, with emoji; ~30 entries; masculine/feminine pairs (`כלב/כלבה`, `חתול/חתולה`) go in `forms` (ms/fs) where the language really has both.
**Acceptance criteria:** [ ] Pairs show `forms` ms/fs; no `forms` for animals that have only one form. **Verification:** [ ] `check:task` green. **Dependencies:** T29. **Files:** `data/sections/animals.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 33 entries, emoji on all but two, ms/fs forms only where Hebrew has both (dog, cat, horse, rooster/hen, lion/lioness). Mouse appears in Objects (computer) and Animals, each with a note pointing to the other.


### Task 31: The home: rooms, things, MAMAD (`home`)
**Description:** Rooms (kitchen, bedroom, shower room, toilet, living room, balcony, corridor, entrance), household things (bed, sofa, wardrobe, mirror, window, door, lamp), and the safe room with its kinds.
**Groups:** `rooms`, `things`, `shelter` (ממ"ד dwelling safe room; ממ"ק on the floor of a building; ממ"מ in an institution; מקלט a public shelter).
**Acceptance criteria:** [ ] Each shelter kind has a `note` with what the abbreviation stands for, in both languages. [ ] The owner confirms the four meanings at Checkpoint J. [ ] Decide whether the query "ממד" (no gershayim) should match: if yes, a `core/search.js` change with a failing unit test first; if no, nothing.
**Verification:** [ ] `check:task` green. **Dependencies:** T29. **Files:** `data/sections/home.json`, `data/index.json` (+ `search.js` and its test only if decided). **Scope:** Medium.
**Outcome:** 37 entries in 3 groups. Safe-room kinds as agreed: mamad (apartment), mamak (floor), mamam (institution), miklat (public shelter), plus the general term, siren and red alert. Search already ignores gershayim; a unit test documents it.


### Task 32: Kitchen (`kitchen`)
**Groups:** `dishes` (plate, cup, glass, bowl, pot, pan), `cutlery` (knife, fork, spoon, teaspoon), `appliances` (fridge, freezer, oven, stove, microwave, kettle), `other` (sink, tap, cutting board, tablecloth). ~25 entries. **Acceptance criteria:** [ ] Nothing repeats `home`. **Verification:** [ ] `check:task` green. **Dependencies:** T29. **Files:** `data/sections/kitchen.json`, `data/index.json`. **Scope:** Small–Medium.
**Outcome:** 31 entries in 4 groups; nothing repeats the home section (table and chair live there).


### Task 33: Fruit and vegetables (`produce`)
**Groups:** `fruit`, `vegetables` (~40 entries, emoji where a clear one exists). **Acceptance criteria:** [ ] `limon` (already in `vocab`) is not duplicated, only referenced by note. [ ] Where a plural is the usual form in a shop (`עגבניות`), the entry's `he` is the singular and the plural is `related`. **Verification:** [ ] `check:task` green; **duration noted**. **Dependencies:** T29. **Files:** `data/sections/produce.json`, `data/index.json`. **Scope:** Medium.
**Outcome:** 34 entries (18 fruit, 16 vegetables) with emoji where clear and plural forms as related; limon stays in Words, referenced by a note.


### Task 34: Partners and relatives in Family (`family`, extended)
**Description:** Husband (exists), wife, partner m./f., boyfriend/girlfriend, fiancé(e), ex, in-laws, cousin, niece, nephew, aunt, step-/half- kin as short as useful. Friend (exists as `family.khaver`) gets a `note`: the same word means "boyfriend" and `חברה` "girlfriend".
**Acceptance criteria:** [ ] Two new groups (`partners`, `relatives`) are added to `family.json`; existing ids unchanged. [ ] `family.khaver` and `family.baal` keep their ids. [ ] The page-bar / contents groups lists are updated by the data alone.
**Verification:** [ ] `check:task` green. **Dependencies:** None. **Files:** `data/sections/family.json`. **Scope:** Small–Medium.
**Outcome:** Family 17 → 35 entries: groups partners (9) and relatives (9); khaver gets a note (friend / boyfriend); existing ids unchanged. neighbours.shkhena removed as a duplicate of the forms of family.shakhen.


### Checkpoint J: Everything
- [ ] `npm run check:full` green; `check:task` duration; first load ≤ 200 KB; the `around` part JSON size reported
- [ ] Owner skims Around us and Family and confirms the MAMAD kinds

## Phase 11: Release

### Task 35: Docs, check, push, live check
**Acceptance criteria:**
- [x] SPEC: the structure/capability lines name the new parts and sections; README lists them if it lists sections. No other doc change.
- [x] `npm run check:full` green; fresh-context reviewer pass on all new `data/` for translit rules, nikud and gender marks reported to the owner (not a substitute for `verified`).
- [ ] After the owner's go, push; CI green; the live `data/index.json` lists the new part and sections.
**Dependencies:** all above. **Scope:** Small.
