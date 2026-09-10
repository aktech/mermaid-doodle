import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * These assertions read the actual files tsup writes to dist/, not source.
 * Playwright's webServer runs `npm run build` before it starts the server
 * these specs load pages from, so a run where nothing is already listening
 * on that port (a fresh checkout, CI, or dist/ deleted) always sees a
 * rebuilt dist/ here. reuseExistingServer means a server left running from
 * an earlier local `npm run test:dom` skips that build step, so freshness
 * is guaranteed in that case only if dist/ was already correct.
 */
const DIST = join(process.cwd(), 'dist');

const jsArtifacts = () => readdirSync(DIST).filter((name) => name.endsWith('.js'));

test('the IIFE bundle never re-absorbs mermaid through the bare specifier import', () => {
  const iife = readFileSync(join(DIST, 'auto.iife.js'));
  expect(iife.toString('utf8')).not.toContain('import("mermaid")');
  // Bundling mermaid in blew this file from ~12 KB to 7.57 MB. A 100 KB
  // ceiling fails loudly long before that happens again.
  expect(iife.length).toBeLessThan(100 * 1024);
});

test('the ESM build keeps a literal, bundler-visible import("mermaid")', () => {
  // dist/index.js re-exports from a content-hashed shared chunk, so search
  // every non-IIFE JS file in dist rather than hardcode a chunk name.
  const esmFiles = jsArtifacts().filter((name) => !name.includes('iife'));
  const combined = esmFiles
    .map((name) => readFileSync(join(DIST, name), 'utf8'))
    .join('\n');
  expect(combined).toContain('import("mermaid")');
});

test('no JS artifact in dist bundles mermaid, whatever build config produced it', () => {
  // Nothing forces a future build config to set __DOODLE_BARE_IMPORT__ to
  // false for a new browser-shaped entry. tsc can't catch a missing
  // `define`, and the two tests above only ever look at auto.iife.js by
  // name, so a differently-named config that forgets it would reproduce
  // the exact silent 7.57 MB bundling defect an earlier build
  // configuration produced here, with
  // nothing here to catch it. This scans every JS file dist/ actually
  // holds instead of a hardcoded filename.
  //
  // The marker is deliberately not "sequenceDiagram": src/highlight.ts's
  // own keyword list contains that literal, which would flag our own,
  // entirely unbundled source as a false positive.
  const MERMAID_INTERNAL_MARKER = 'flowchart-elk';
  const SIZE_CEILING_BYTES = 100 * 1024;

  for (const name of jsArtifacts()) {
    const path = join(DIST, name);
    const size = statSync(path).size;
    expect(size, `${name} is ${size} bytes`).toBeLessThan(SIZE_CEILING_BYTES);

    const content = readFileSync(path, 'utf8');
    expect(content, `${name} contains a mermaid-internal marker`).not.toContain(
      MERMAID_INTERNAL_MARKER,
    );
  }
});
