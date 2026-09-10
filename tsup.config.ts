import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/auto.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['mermaid'],
    // Keeps the literal `import('mermaid')` in mermaid-loader.ts live, so a
    // bundler consumer (Vite, webpack) can see and resolve it.
    define: { __DOODLE_BARE_IMPORT__: 'true' },
    onSuccess: async () => {
      copyFileSync('src/styles.css', 'dist/styles.css');
    },
  },
  {
    entry: { 'auto.iife': 'src/auto.ts' },
    format: ['iife'],
    globalName: 'mermaidDoodle',
    dts: false,
    clean: false,
    external: ['mermaid'],
    // Folds the bare-import branch to `false` so esbuild dead-code
    // eliminates it, literal `import('mermaid')` included: a plain browser
    // page has no resolver for that specifier, and leaving it in is what
    // made esbuild bundle mermaid whole into this file instead.
    define: { __DOODLE_BARE_IMPORT__: 'false' },
    // tsup's default iife extension is ".global.js"; consumers (and the
    // fixture) expect dist/auto.iife.js.
    outExtension: () => ({ js: '.js' }),
  },
]);
