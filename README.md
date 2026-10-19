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

## Fonts

Self-hosted, subset to Hebrew with nikud, Basic Latin and punctuation (`npm run fonts`, which downloads from [google/fonts](https://github.com/google/fonts) at a pinned commit):

- **Heebo** by Oded Ezer (print and interface), weights 400–700, SIL Open Font License 1.1 ([`assets/fonts/OFL-Heebo.txt`](assets/fonts/OFL-Heebo.txt))
- **Gveret Levin** by AlefAlefAlef (cursive), SIL Open Font License 1.1 ([`assets/fonts/OFL-GveretLevin.txt`](assets/fonts/OFL-GveretLevin.txt))

## License

Code: MIT (see [`LICENSE`](LICENSE)). Fonts: SIL OFL 1.1 (see above).
