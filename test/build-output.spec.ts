import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * These assertions read the actual files tsup writes to dist/, not source.
 * Playwright's webServer runs `npm run build` before any spec runs, so
 * dist/ is guaranteed fresh here.
 */
const DIST = join(process.cwd(), 'dist');

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
  const esmFiles = readdirSync(DIST).filter(
    (name) => name.endsWith('.js') && !name.includes('iife'),
  );
  const combined = esmFiles
    .map((name) => readFileSync(join(DIST, name), 'utf8'))
    .join('\n');
  expect(combined).toContain('import("mermaid")');
});
