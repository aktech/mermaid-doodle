#!/usr/bin/env node
// Regenerates the README screenshots in docs/media/ from the fixtures in
// scripts/fixtures/. Run with `npm run screenshots` whenever those fixtures
// change; dist must be built first (the npm script does that for you), the
// same way playwright.config.ts builds before serving test fixtures.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4174;
const OUT_DIR = join(ROOT, 'docs/media');

// Breathing room around the measured content, in CSS pixels, on every side.
const MARGIN = 28;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function startServer() {
  const server = createServer(async (req, res) => {
    const path = join(ROOT, normalize(decodeURI((req.url ?? '/').split('?')[0])));
    if (!path.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function waitReady(locator) {
  await locator.waitFor({ state: 'attached' });
}

/**
 * The bounding box, in main-page coordinates, of the union of every given
 * locator (each may live in the main frame or inside an iframe: Playwright
 * reports boundingBox() relative to the main frame either way). Used to
 * crop to what a diagram (and, where relevant, a caption next to it)
 * actually rendered as, instead of a hand-picked viewport rectangle that
 * silently goes stale the moment the diagram's size changes.
 */
async function contentBox(locators) {
  const boxes = await Promise.all(locators.map((locator) => locator.boundingBox()));
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/** Screenshot the measured union of `locators` plus MARGIN on every side. */
async function captureContent(page, path, locators, margin = MARGIN) {
  const box = await contentBox(locators);
  await page.screenshot({
    path,
    clip: {
      x: box.left - margin,
      y: box.top - margin,
      width: box.width + margin * 2,
      height: box.height + margin * 2,
    },
  });
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  // Generous viewport: the crop below is what actually ends up in the PNG,
  // this just needs to be large enough that no diagram is clipped before
  // it is measured.
  const context = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();

  // hero-light.png / hero-dark.png: one flowchart, same DOM, theme swapped
  // in place so the pair is guaranteed to show the exact same diagram.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/hero.html`);
  await waitReady(page.locator('body[data-ready="true"]'));
  await captureContent(page, join(OUT_DIR, 'hero-light.png'), [page.locator('.doodle-diagram svg')]);
  await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await window.renderer.render();
  });
  await captureContent(page, join(OUT_DIR, 'hero-dark.png'), [page.locator('.doodle-diagram svg')]);

  // palettes.png: two independent documents (iframes), each with its own
  // root-level --doodle-* variables, so a single screenshot proves the
  // package reads whatever palette its own page defines. Each iframe is
  // shrunk to its own measured content (diagram + caption) plus MARGIN, so
  // the two panels stay solid blocks of their own background colour
  // instead of a tight crop that would cut into it unevenly.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/palettes.html`);
  await waitReady(page.frameLocator('#a').locator('body[data-ready="true"]'));
  await waitReady(page.frameLocator('#b').locator('body[data-ready="true"]'));
  for (const id of ['a', 'b']) {
    const frame = page.frameLocator(`#${id}`);
    const box = await contentBox([frame.locator('svg'), frame.locator('.site-label')]);
    await page.evaluate(
      ({ id, width, height }) => {
        const iframe = document.getElementById(id);
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;
      },
      { id, width: Math.ceil(box.width) + MARGIN * 2, height: Math.ceil(box.height) + MARGIN * 2 },
    );
  }
  await page.locator('#row').screenshot({ path: join(OUT_DIR, 'palettes.png') });

  // source-panel.png: a diagram with data-doodle-source, panel and diagram
  // captured together.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/source-panel.html`);
  await waitReady(page.locator('body[data-ready="true"]'));
  await captureContent(page, join(OUT_DIR, 'source-panel.png'), [
    page.locator('.doodle-source'),
    page.locator('.doodle-diagram svg'),
  ]);

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
