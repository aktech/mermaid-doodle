import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/auto.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['mermaid'],
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
    // tsup's default iife extension is ".global.js"; consumers (and the
    // fixture) expect dist/auto.iife.js.
    outExtension: () => ({ js: '.js' }),
  },
]);
