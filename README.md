# Ivrit Studio

A Hebrew cheatsheet for Alef-level ulpan students, set like a small reference book: print and cursive letters, nikud, geresh, phrases, words, countries and languages, gender and number. Static site with no build step and no runtime dependencies, hosted on GitHub Pages.

- What to build: [`SPEC.md`](SPEC.md)
- Quality bar: [`CONSTRAINTS.md`](CONSTRAINTS.md)
- Implementation plan: [`tasks/plan.md`](tasks/plan.md)

## Commands

```sh
npm install                              # dev dependencies only (Playwright, axe)
npx playwright install chromium webkit   # browsers for e2e

npm run serve        # http://localhost:8000
npm test             # unit tests
npm run check:fast   # after edits
npm run check:task   # before every commit
npm run check:full   # before push (adds webkit, Semgrep, osv-scanner)
```

## Using the site

- **Contents** (`#/`) lists the four parts (Reading, Phrases, Vocabulary, Grammar) and their sections. Each part is one scrolling page. The header always shows the parts.
- **Search** (the magnifier on a phone, the field on a laptop, or press `/`) finds an entry by Hebrew with or without nikud, by reading, or by its English or Russian meaning. Press Escape to clear it.
- **Nikud** in the header turns the vowel points off, to test your reading. The alphabet keeps its dagesh and shin/sin dots.
- **EN / RU** switches the interface and the translations. English is the default.
- **◐** cycles the theme: auto (follows the system), light, dark.
- **The bar under the header** on a part page names the section you are reading. Tap it to jump to another section or group. It also holds **Hide translations**, which blurs readings and meanings: tap one to check yourself.
- **The ruler** at the right edge (laptop, long pages) is a millimetre ruler that moves with the page; its marker reads where you are and the marks show where each section starts. Drag it to move the page, click a point to bring it to the reading line, or focus it and use the arrow keys, Page Up/Down, Home and End. It replaces the browser's scrollbar.
- **Section titles** beside the ruler (wide screens) flow as you scroll: passed sections at the top, the one you are reading large, the next ones at the bottom. Click one to go there.
- **Print** a part (Ctrl/⌘ + P) for a clean A4 sheet, black on white, with everything shown.

## Changing content (data only, no code)

Content lives in `data/`. The **Data Contract** section of [`SPEC.md`](SPEC.md) is all the context an agent needs.

- **New entry:** add it to the section file in `data/sections/<id>.json`. In a section with groups, give it a `group`. Ids are `<section>.<slug>` and are never renamed. New entries are `"verified": false`.
- **New section:** add `data/sections/<id>.json` and put its id in the `sections` of one part in `data/index.json`.
- Run `node scripts/validate.mjs`, then `npm run check:task`, then commit the data alone and push.

## Checking nikud

Every entry starts as `"verified": false`, and the validator prints how many are still unchecked. Check the Hebrew with [Dicta Nakdan](https://nakdan.dicta.org.il/) and ask the teacher when in doubt. Only then set `"verified": true`.

## Publishing

The site is static and has no build step. On GitHub, go to **Settings → Pages → Deploy from a branch → `main` / `(root)`**. The site appears at `https://<user>.github.io/ivrit-studio/`. CI (`.github/workflows/check.yml`) only runs the checks.

## Fonts

Self-hosted, subset to Hebrew with nikud, Basic Latin and punctuation (`npm run fonts`, which downloads from [google/fonts](https://github.com/google/fonts) at a pinned commit). Latin headings use the system serif, so nothing else is downloaded.

- **Heebo** by Oded Ezer (print and interface), weights 400–700, SIL Open Font License 1.1 ([`assets/fonts/OFL-Heebo.txt`](assets/fonts/OFL-Heebo.txt))
- **Gveret Levin** by AlefAlefAlef (cursive), SIL Open Font License 1.1 ([`assets/fonts/OFL-GveretLevin.txt`](assets/fonts/OFL-GveretLevin.txt))

## License

Code: MIT (see [`LICENSE`](LICENSE)). Fonts: SIL OFL 1.1 (see above).
