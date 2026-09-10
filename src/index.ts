export { currentTheme, watchTheme } from './theme.ts';
export type { ThemeName } from './theme.ts';
export { collectSources, extractSource, DEFAULT_SELECTOR } from './sources.ts';
export type { DiagramSource } from './sources.ts';
export { buildSourceView } from './source-view.ts';
export { highlight, escapeHtml } from './highlight.ts';
export { createRenderer } from './renderer.ts';
export type { DoodleOptions, DoodleRenderer } from './renderer.ts';
export { resolveMermaid, DEFAULT_CDN_URL } from './mermaid-loader.ts';
export type { MermaidLike } from './mermaid-loader.ts';
export {
  DEFAULT_PALETTE,
  VAR_NAMES,
  paletteFromVars,
  toThemeVariables,
} from './palette.ts';
export type { DoodlePalette } from './palette.ts';
