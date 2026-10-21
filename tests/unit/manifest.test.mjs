import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', ROOT), 'utf8'));
const html = readFileSync(new URL('index.html', ROOT), 'utf8');
const css = readFileSync(new URL('assets/css/app.css', ROOT), 'utf8');

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file) {
  const bytes = readFileSync(new URL(file, ROOT));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${file} is a PNG`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe('manifest.webmanifest', () => {
  it('names the app and opens it standalone from the site root, whatever path it is served under', () => {
    assert.equal(manifest.name, 'Ivrit Studio');
    assert.ok(manifest.short_name.length > 0 && manifest.short_name.length <= 12);
    assert.equal(manifest.display, 'standalone');
    for (const key of ['start_url', 'scope', 'id']) assert.equal(manifest[key], './', key);
  });

  it('uses the light paper colour of the design tokens for the splash screen and the title bar', () => {
    const paper = /:root \{[^}]*--paper: (#[0-9a-f]{6});/i.exec(css)[1];
    assert.equal(manifest.background_color, paper);
    assert.equal(manifest.theme_color, paper);
  });

  it('lists square icons of the sizes it declares, small enough not to weigh on the first visit', () => {
    const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose ?? 'any'}`).sort();
    assert.deepEqual(sizes, ['192x192:any', '512x512:any', '512x512:maskable']);
    for (const icon of manifest.icons) {
      assert.equal(icon.type, 'image/png');
      assert.ok(!/^[a-z]+:|^\//.test(icon.src), `${icon.src} is relative to the manifest`);
      const [width, height] = pngSize(icon.src);
      assert.equal(`${width}x${height}`, icon.sizes, icon.src);
      assert.ok(statSync(new URL(icon.src, ROOT)).size <= 20 * 1024, `${icon.src} <= 20 KB`);
    }
  });
});

describe('index.html', () => {
  it('links the manifest, an Apple touch icon of 180 px, and a theme colour for each scheme', () => {
    assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
    const touch = /<link rel="apple-touch-icon" href="([^"]+)">/.exec(html);
    assert.ok(touch, 'apple-touch-icon');
    assert.deepEqual(pngSize(touch[1]), [180, 180]);
    assert.match(html, /<meta name="theme-color" content="#f6f2e9" media="\(prefers-color-scheme: light\)">/);
    assert.match(html, /<meta name="theme-color" content="#181613" media="\(prefers-color-scheme: dark\)">/);
  });

  it('keeps the favicon inline, so the page makes no favicon request', () => {
    assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  });
});
