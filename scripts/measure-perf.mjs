#!/usr/bin/env node
// measure-perf.mjs — a repeatable performance baseline (Task 19). Dev tool, run by hand:
//   node scripts/measure-perf.mjs [runs]        (default 5 runs per scenario, medians reported)
// It serves the site itself on a throwaway local port with gzip and `cache-control: max-age=600`, as
// GitHub Pages does, so the transfer sizes and the cache behave like the live site. Chromium is
// throttled through the DevTools protocol: a phone (4x CPU slowdown, 1.6 Mbps, 150 ms) and a laptop
// (no CPU slowdown, 10 Mbps, 40 ms). Every run is cold: a fresh browser context. Prints Markdown.
import http from 'node:http';
import zlib from 'node:zlib';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RUNS = Number(process.argv[2] ?? 5);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png',
};
const PROFILES = {
  phone: { viewport: { width: 360, height: 640 }, hasTouch: true, cpu: 4, latency: 150, bytesPerSecond: 200_000 },
  laptop: { viewport: { width: 1280, height: 720 }, hasTouch: false, cpu: 1, latency: 40, bytesPerSecond: 1_250_000 },
};

function serve() {
  const server = http.createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
    let file = join(ROOT, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const headers = { 'content-type': type, 'cache-control': 'max-age=600' };
    let body = readFileSync(file);
    if (/^(text|application\/(json|manifest))|javascript/.test(type) && /gzip/.test(request.headers['accept-encoding'] ?? '')) {
      body = zlib.gzipSync(body);
      headers['content-encoding'] = 'gzip';
    }
    response.writeHead(200, { ...headers, 'content-length': body.length }).end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const round = (value, digits = 0) => Number(value.toFixed(digits));

/** Page-side observers, installed before the page's own scripts. */
const OBSERVE = () => {
  window.perf = { lcp: 0, fcp: 0, cls: 0, longTasks: 0 };
  const watch = (type, onEntry) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    new PerformanceObserver((list) => list.getEntries().forEach(onEntry)).observe({ type, buffered: true });
  };
  watch('largest-contentful-paint', (entry) => { window.perf.lcp = entry.startTime; });
  watch('paint', (entry) => { if (entry.name === 'first-contentful-paint') window.perf.fcp = entry.startTime; });
  watch('layout-shift', (entry) => { if (!entry.hadRecentInput) window.perf.cls += entry.value; });
  watch('longtask', (entry) => { window.perf.longTasks += entry.duration; });
};

async function newSession(browser, profile, origin, hash) {
  const context = await browser.newContext({ viewport: profile.viewport, hasTouch: profile.hasTouch });
  const page = await context.newPage();
  await page.addInitScript(OBSERVE);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: profile.latency, downloadThroughput: profile.bytesPerSecond, uploadThroughput: profile.bytesPerSecond,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
  const requests = new Map();
  const bytes = { total: 0 };
  cdp.on('Network.requestWillBeSent', ({ requestId, request, initiator }) => {
    requests.set(requestId, { url: request.url, parent: initiator.url ?? initiator.stack?.callFrames?.[0]?.url ?? null });
  });
  cdp.on('Network.loadingFinished', ({ encodedDataLength }) => { bytes.total += encodedDataLength; });
  const started = Date.now();
  await page.goto(`${origin}/${hash}`);
  await page.locator('#app[data-ready="true"]').waitFor();
  const ready = Date.now() - started;
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(300);
  return { context, page, cdp, requests, bytes, ready };
}

/** The longest chain of requests where each was started by the one before. */
function chainDepth(requests, origin) {
  const parentOf = new Map([...requests.values()].map((request) => [request.url, request.parent]));
  const depth = (url, seen = new Set()) => {
    const parent = parentOf.get(url);
    if (!parent || seen.has(url) || !parentOf.has(parent)) return 1;
    return 1 + depth(parent, new Set([...seen, url]));
  };
  return Math.max(...[...parentOf.keys()].filter((url) => url.startsWith(origin)).map((url) => depth(url)));
}

async function coldLoad(browser, profile, origin, hash) {
  const session = await newSession(browser, profile, origin, hash);
  const perf = await session.page.evaluate(() => window.perf);
  const result = {
    fcp: perf.fcp, lcp: perf.lcp, cls: perf.cls, longTasks: perf.longTasks, ready: session.ready,
    requests: session.requests.size, kb: session.bytes.total / 1024, depth: chainDepth(session.requests, origin),
  };
  await session.context.close();
  return result;
}

/** From a click on Nikud to the page being rebuilt and painted again. */
async function nikudToggle(browser, profile, origin) {
  const session = await newSession(browser, profile, origin, '#/words');
  const ms = await session.page.evaluate(() => new Promise((resolve) => {
    const app = document.getElementById('app');
    const button = document.querySelector('[data-setting="nikud"]');
    const start = performance.now();
    const done = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
    new MutationObserver((_, observer) => {
      if (app.dataset.ready === 'true') {
        observer.disconnect();
        done();
      }
    }).observe(app, { attributes: true, attributeFilter: ['data-ready'] });
    button.click();
  }));
  await session.context.close();
  return { ms };
}

/** Scrolling the longest part from top to bottom in 60 steps, one per frame. */
async function longScroll(browser, profile, origin) {
  const session = await newSession(browser, profile, origin, '#/words');
  await session.cdp.send('Performance.enable');
  const start = Object.fromEntries((await session.cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const frames = await session.page.evaluate(() => new Promise((resolve) => {
    const times = [];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    let step = 0;
    let last = performance.now();
    const tick = (now) => {
      times.push(now - last);
      last = now;
      window.scrollTo(0, (max * step) / 60);
      step += 1;
      if (step <= 60) requestAnimationFrame(tick);
      else resolve(times.slice(1));
    };
    requestAnimationFrame(tick);
  }));
  const end = Object.fromEntries((await session.cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  await session.context.close();
  const taskMs = (name) => (end[name] - start[name]) * 1000;
  return {
    worstFrame: Math.max(...frames), slowFrames: frames.filter((frame) => frame > 50).length,
    scriptMs: taskMs('ScriptDuration'), layoutMs: taskMs('LayoutDuration'), styleMs: taskMs('RecalcStyleDuration'),
  };
}

const times = async (runs, fn) => {
  const out = [];
  for (let i = 0; i < runs; i += 1) out.push(await fn());
  return out;
};
const med = (rows, key, digits = 0) => round(median(rows.map((row) => row[key])), digits);

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  console.log(`Run: ${new Date().toISOString().slice(0, 10)}, ${RUNS} cold runs per scenario, medians. Local server with gzip and max-age=600.\n`);
  for (const [name, profile] of Object.entries(PROFILES)) {
    console.log(`### ${name} (${profile.viewport.width}×${profile.viewport.height}, CPU ${profile.cpu}x, ${profile.bytesPerSecond * 8 / 1e6} Mbps, ${profile.latency} ms)\n`);
    console.log('| Scenario | FCP ms | LCP ms | App ready ms | CLS | Long tasks ms | Requests | KB | Chain |');
    console.log('|---|---|---|---|---|---|---|---|---|');
    for (const hash of ['#/', '#/words']) {
      const rows = await times(RUNS, () => coldLoad(browser, profile, origin, hash));
      console.log(`| load ${hash} | ${med(rows, 'fcp')} | ${med(rows, 'lcp')} | ${med(rows, 'ready')} | ${med(rows, 'cls', 3)} | ${med(rows, 'longTasks')} | ${med(rows, 'requests')} | ${med(rows, 'kb', 1)} | ${med(rows, 'depth')} |`);
    }
    const toggles = await times(RUNS, () => nikudToggle(browser, profile, origin));
    const scrolls = await times(RUNS, () => longScroll(browser, profile, origin));
    console.log(`\nNikud toggle on #/words (click to repainted): **${med(toggles, 'ms')} ms**.`);
    console.log(`Scroll #/words top to bottom (60 frames): worst frame **${med(scrolls, 'worstFrame')} ms**, frames over 50 ms **${med(scrolls, 'slowFrames')}**, script ${med(scrolls, 'scriptMs')} ms, layout ${med(scrolls, 'layoutMs')} ms, style ${med(scrolls, 'styleMs')} ms.\n`);
  }
} finally {
  await browser.close();
  server.close();
}
