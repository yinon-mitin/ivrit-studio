# Implementation Plan: Ivrit Studio — Reading aids, page navigation, second cursive, more vocabulary

Previous plans: `tasks/archive/mvp-*.md` (trainer MVP), `tasks/archive/redesign-*.md` (pivot to cheatsheet, released 2026-10-20 as `abb677b`).

## Overview
Five owner requests (2026-10-20):
1. **Nikud you can see change on the contents page.** Today the toggle does nothing there. The contents icons and the header mark will follow it, with a short crossfade.
2. **Hide translations always at hand.** The toggle moves into a sticky page bar, so it works anywhere on a long page.
3. **Two cursive styles** instead of the "Print over cursive" group, which repeats the letter grid.
4. **More vocabulary:** numbers, days and time, colours, family and people.
5. **Page navigation on long pages**, after getartcraft.com. On a laptop: a fixed vertical ruler on the right (`role="scrollbar"`, ticks, a position marker with %, section markers, click/drag to jump). On a phone: the sticky page bar shows the current section (tap for a jump list) and a progress line.

Static, zero runtime deps and no build stay as they are. The `CONSTRAINTS.md` bar is unchanged. Detailed tasks: `tasks/todo.md`.

## Decisions (owner, 2026-10-20)
- Archive the redesign plan; its open manual checks move here (Checkpoint D).
- Cursive: a **second cursive font**. Google Fonts has no second modern Israeli cursive (only Gveret Levin; Solitreo is a historical Ladino script, Playpen Sans Hebrew and Amatic SC are handwritten print). Candidate: **Ktav Yad CLM** (Culmus, GPL-2 with font exception, no nikud). Task 5 is a spike that ends with an owner go/no-go before any font lands (SPEC: font changes are "ask first").
- Vocabulary blocks: numbers, days and time, colours, family and people. Every new entry is `verified: false`, and the owner checks the nikud.
- Phone navigation: the **sticky page bar** (current section with a jump list, a progress line, Hide). On a laptop the bar keeps Hide and the current section, and the ruler is added.

## Dependency Graph
```
core/scroll.js (pure: scroll %, current anchor, % → scrollY)
        │
        ├── T2 sticky page bar (phone + laptop): current section, jump list, progress, Hide
        │         │
        │         └── T3 laptop ruler (role=scrollbar) — reuses the same anchors and scroll math
        │
T1 nikud on contents + brand (independent)

T4 font spike ──(owner go)──► T5 second cursive in the alphabet (font subset, letter-rows view, data)

T6 swatch + m/f-only forms in the list view (code) ──► T7 numbers · T8 days & time · T9 colours · T10 family (data only)
                                                                │
                                                       T11 docs, release
```

## Architecture Decisions
- **One scroll model.** `core/scroll.js` holds the pure math: `scrollPercent`, `currentAnchor(anchors, scrollY, offset)` and `scrollForPercent`, unit-tested. The DOM side reads anchor offsets once per render and on resize. A single passive `scroll` listener (rAF-throttled) updates both the bar and the ruler.
- **The ruler is accessible, its marks are not interactive.** Children of `role="scrollbar"` are presentational. The ruler is focusable (`tabindex="0"`) with arrow/PageUp/PageDown/Home/End, and `aria-valuenow` is the scroll %. Section links for keyboard and screen-reader users live in the page bar's jump list, which is a real list of links.
- **Ticks in CSS, not 100 spans.** A `repeating-linear-gradient` draws minor and major ticks. Only section markers and the position marker are elements.
- **Sticky height budget.** Phone: header (≤ 96 px) + page bar (≤ 36 px) ≤ 132 px of 664 px. `scroll-margin-top` follows. Laptop: header ≤ 64 px + bar ≤ 40 px.
- **Nikud crossfade without duplicating content.** Only the contents icons and the brand mark (short words) get a two-layer crossfade (with/without nikud stacked, opacity transition, off under `prefers-reduced-motion`). Entries on part pages swap as today.
- **Second cursive as a third line in letter-rows.** The "rows" group becomes "Two cursive styles": print, Gveret Levin, Ktav Yad, right to left, with the style names at the line starts. The letter grid stays print + Gveret Levin. The font loads only when that group renders (`font-display: swap`, unicode-range Hebrew).
- **New list features stay generic.** `swatch` (already in the Data Contract) renders as a colour chip. Numbers use `forms` with only `ms`/`fs`, and the forms table drops empty columns. Content stays data-only.

## Task List

### Phase 1: Reading aids
- [ ] Task 1: Nikud toggle visibly changes the contents page and the header mark
- [ ] Task 2: Sticky page bar: current section, jump list, progress line, Hide toggle

### Checkpoint A
- [ ] `npm run check:task` green; phone + laptop screenshots of a long part with the bar

### Phase 2: Laptop ruler
- [ ] Task 3: Scroll ruler on the right (role=scrollbar) with section markers

### Checkpoint B: navigation review
- [ ] Owner reviews the bar and the ruler (screenshots or local run) before content work

### Phase 3: Second cursive
- [ ] Task 4: Spike: Ktav Yad CLM — license, glyphs, look, size → owner go/no-go
- [ ] Task 5: Two cursive styles in the alphabet (only after "go")

### Phase 4: Vocabulary
- [ ] Task 6: List view: colour swatches and m/f-only forms
- [ ] Task 7: Numbers (data)
- [ ] Task 8: Days and time (data)
- [ ] Task 9: Colours (data)
- [ ] Task 10: Family and people (data)

### Checkpoint C: content review
- [ ] Owner skims the new sections; nikud stays `verified: false` until checked with Dicta

### Phase 5: Release
- [ ] Task 11: SPEC/README, `check:full`, push (with approval)

### Checkpoint D: complete (includes checks carried over from the redesign)
- [ ] CI green on the release push
- [ ] Owner opens the print PDFs of Reading and Vocabulary (carried over)
- [ ] Owner opens the site on a real phone in both themes and both languages (carried over)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| No acceptable second cursive font (license, look, missing dagesh/shin dots) | High | Task 4 is a spike with a written verdict and a sample screenshot. Nothing ships without the owner's "go". Fallbacks to offer: cursive-only drill, words in cursive. |
| Sticky header + bar eat too much of a phone screen | Med | Height budget ≤ 132 px tested in e2e. The bar is one 32–36 px line. |
| Scroll listener jank on phones | Low | Passive listener + rAF, offsets cached per render/resize, ~200 anchors at most |
| `role="scrollbar"` axe rules (required `aria-controls`, `aria-valuenow`) | Med | e2e axe on every part with the ruler visible (laptop project) |
| New Hebrew content with wrong nikud | High | All `verified: false`; validator warning count reported; owner checks with Dicta Nakdan; no `verified: true` without the owner |
| Second font pushes first load over 200 KB | Low | Font is lazy (only the alphabet's style group requests it); ≤ 60 KB subset; weight test unchanged |

## Answered (owner, 2026-10-20)
- Numbers: 0–20, tens, and 100 and above (hundreds to 900, thousands, a million).
- Months: Gregorian only.
