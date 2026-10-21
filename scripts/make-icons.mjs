#!/usr/bin/env node
// make-icons.mjs — draws the app icons: the letter א in the site's own Heebo on the paper colour, in
// the accent blue. Dev tool, run by hand (`node scripts/make-icons.mjs`); the PNGs are committed.
// "any" icons fill the square; the maskable one keeps the letter inside the central safe zone, the
// Apple touch icon is full-bleed (iOS rounds it itself).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ROOT = new URL('../', import.meta.url);
const PAPER = '#f6f2e9';
const ACCENT = '#1f4a8a';
const ICONS = [
  { file: 'assets/icons/icon-192.png', size: 192, letter: 0.95 },
  { file: 'assets/icons/icon-512.png', size: 512, letter: 0.95 },
  { file: 'assets/icons/icon-maskable-512.png', size: 512, letter: 0.68 },
  { file: 'assets/icons/apple-touch-icon.png', size: 180, letter: 0.95 },
];

const font = readFileSync(new URL('assets/fonts/heebo.woff2', ROOT)).toString('base64');
const page = (size, letter) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: Heebo; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 400 700; }
  html, body { margin: 0; background: ${PAPER}; }
  body { width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; }
  span { font: 700 ${Math.round(size * letter)}px/1 Heebo; color: ${ACCENT}; padding-bottom: ${Math.round(size * letter * 0.06)}px; }
</style><span lang="he">א</span>`;

mkdirSync(new URL('assets/icons/', ROOT), { recursive: true });
const browser = await chromium.launch();
try {
  for (const { file, size, letter } of ICONS) {
    const tab = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await tab.setContent(page(size, letter));
    await tab.evaluate(() => document.fonts.ready.then(() => undefined));
    writeFileSync(new URL(file, ROOT), await tab.screenshot({ clip: { x: 0, y: 0, width: size, height: size } }));
    await tab.close();
    console.log(`wrote ${file}`);
  }
} finally {
  await browser.close();
}
