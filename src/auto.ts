import { createRenderer, type DoodleOptions } from './renderer.ts';

declare global {
  interface Window {
    mermaidDoodleConfig?: DoodleOptions;
  }
}

/**
 * Side-effect entry: mounts a renderer with the page's configuration, if any.
 * Consumers who want control over timing import the core entry instead.
 */
function start(): void {
  void createRenderer(window.mermaidDoodleConfig ?? {}).mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

export {};
