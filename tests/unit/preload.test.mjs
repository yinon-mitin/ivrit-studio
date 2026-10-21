import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

// index.html preloads every module the app imports, so the browser asks for all of them at once instead
// of finding them level by level (there is no bundler). A module added or removed without updating the
// hints would quietly bring the waterfall back, or preload a file that is gone.
const ROOT = new URL('../../', import.meta.url).pathname;
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const ENTRY = 'assets/js/main.js';

/** main.js and everything it imports statically, as paths from the site root. */
function importGraph(entry) {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(join(ROOT, file), 'utf8');
    for (const [, specifier] of source.matchAll(/^import[^;]*?from\s+'([^']+)'/gms)) walk(normalize(join(dirname(file), specifier)));
  };
  walk(entry);
  return [...seen].sort();
}

describe('module preload hints', () => {
  it('list exactly the modules main.js imports, directly or not', () => {
    const hinted = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map(([, href]) => href).sort();
    assert.deepEqual(hinted, importGraph(ENTRY));
  });

  it('start from the module the page loads', () => {
    assert.match(html, /<script type="module" src="assets\/js\/main\.js"><\/script>/);
  });
});

describe('data preload', () => {
  // Measured in tasks/notes/perf-baseline.md: no gain beyond noise, and WebKit fetches the file twice.
  it('is not used for data/index.json', () => {
    assert.doesNotMatch(html, /rel="preload"[^>]*data\//);
  });
});
