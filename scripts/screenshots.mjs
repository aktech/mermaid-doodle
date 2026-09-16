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

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();

  // hero-light.png / hero-dark.png: one flowchart, same DOM, theme swapped
  // in place so the pair is guaranteed to show the exact same diagram.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/hero.html`);
  await waitReady(page.locator('body[data-ready="true"]'));
  await page.locator('#capture').screenshot({ path: join(OUT_DIR, 'hero-light.png') });
  await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await window.renderer.render();
  });
  await page.locator('#capture').screenshot({ path: join(OUT_DIR, 'hero-dark.png') });

  // palettes.png: two independent documents (iframes), each with its own
  // root-level --doodle-* variables, so a single screenshot proves the
  // package reads whatever palette its own page defines.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/palettes.html`);
  await waitReady(page.frameLocator('#a').locator('body[data-ready="true"]'));
  await waitReady(page.frameLocator('#b').locator('body[data-ready="true"]'));
  await page.locator('#row').screenshot({ path: join(OUT_DIR, 'palettes.png') });

  // source-panel.png: a diagram with data-doodle-source, panel and diagram
  // captured together.
  await page.goto(`http://127.0.0.1:${PORT}/scripts/fixtures/source-panel.html`);
  await waitReady(page.locator('body[data-ready="true"]'));
  await page.locator('#capture').screenshot({ path: join(OUT_DIR, 'source-panel.png') });

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
