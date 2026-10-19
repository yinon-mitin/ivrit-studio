# Ivrit Studio

A one-screen Hebrew cheatsheet and trainer for Alef-level ulpan students: print and cursive letters, nikud, countries and languages, geresh, and the vocabulary of each week of the course. Static site with no build step and no runtime dependencies, hosted on GitHub Pages.

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

- **Home** has one tile per section. Open a section, or go straight to its **Blitz**.
- **Nikud** in the header turns vowel points off to test your reading. The alphabet and the nikud chart keep theirs.
- **⚙** holds the theme, the interface language (EN/RU), the Russian translation, and **Progress & backup**.
- **Blitz** asks 10 questions in one of two modes: choose one of 4, or flashcards you grade yourself. Mistakes come back more often (Leitner boxes), and wrong options are look-alikes.
- **Progress** stays in this browser. To combine two devices, export on one (download the file or copy the text) and import on the other. Progress from both is merged.
- **Anki**: the Anki button in a section downloads `ivrit-<section>.tsv`. In Anki, use File → Import.

## Adding a week (data only, no code)

1. Give an agent the **Data Contract** section of [`SPEC.md`](SPEC.md) and the teacher's summary, and ask for `data/weeks/YYYY-MM-DD.json`.
2. Add the date to `"weeks"` in `data/index.json`.
3. Follow these rules:
   - Ids are `<section>.<slug>`, and an id is never renamed (progress is stored by id).
   - New entries are `"verified": false`.
   - `letters` lists **every letter taught so far**. The alphabet Blitz asks only these.
   - A tab holds at most 14 entries (24 in letter views). Each week gets its own tab in every section it feeds. If a week has more, spread it over sections (`vocab`, `greetings`, `gender-number`) or put some entries in a tab the section defines.
4. Run `node scripts/validate.mjs`, then `npm run check:task`, then commit the data alone and push.

## Checking nikud

Every entry starts as `"verified": false`, and the validator prints how many are still unchecked. Check the Hebrew with [Dicta Nakdan](https://nakdan.dicta.org.il/) and ask the teacher when in doubt. Only then set `"verified": true`.

## Publishing

The site is static and has no build step. On GitHub, go to **Settings → Pages → Deploy from a branch → `main` / `(root)`**. The site appears at `https://<user>.github.io/ivrit-studio/`. CI (`.github/workflows/check.yml`) only runs the checks.

## Fonts

Self-hosted, subset to Hebrew with nikud, Basic Latin and punctuation (`npm run fonts`, which downloads from [google/fonts](https://github.com/google/fonts) at a pinned commit):

- **Heebo** by Oded Ezer (print and interface), weights 400–700, SIL Open Font License 1.1 ([`assets/fonts/OFL-Heebo.txt`](assets/fonts/OFL-Heebo.txt))
- **Gveret Levin** by AlefAlefAlef (cursive), SIL Open Font License 1.1 ([`assets/fonts/OFL-GveretLevin.txt`](assets/fonts/OFL-GveretLevin.txt))

## License

Code: MIT (see [`LICENSE`](LICENSE)). Fonts: SIL OFL 1.1 (see above).
