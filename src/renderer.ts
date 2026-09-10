import { paletteFromVars, toThemeVariables } from './palette.ts';
import { collectSources, DEFAULT_SELECTOR } from './sources.ts';
import { buildSourceView } from './source-view.ts';
import { watchTheme } from './theme.ts';
import { resolveMermaid, DEFAULT_CDN_URL, type MermaidLike } from './mermaid-loader.ts';

export interface DoodleOptions {
  /** Where to look for diagrams. Defaults to the whole document. */
  root?: ParentNode;
  /** Override the markup shapes that count as a diagram. */
  selector?: string;
  /** Supply mermaid directly instead of letting the loader find it. */
  mermaid?: MermaidLike;
  /** Set to null to refuse the CDN fallback entirely. */
  cdnUrl?: string | null;
  look?: 'handDrawn' | 'classic';
  handDrawnSeed?: number;
  securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  /** Show the source panel for every diagram, not just opted-in ones. */
  showSource?: boolean;
  /** Merged last into the mermaid config, so it can override anything above. */
  mermaidConfig?: Record<string, unknown>;
}

export interface DoodleRenderer {
  render(): Promise<void>;
  mount(): Promise<void>;
  destroy(): void;
}

const WRAP_CLASS = 'doodle-wrap';
const SOURCE_ATTR = 'data-doodle-source';

export function createRenderer(options: DoodleOptions = {}): DoodleRenderer {
  const {
    root = document,
    selector = DEFAULT_SELECTOR,
    mermaid: provided,
    cdnUrl = DEFAULT_CDN_URL,
    look = 'handDrawn',
    handDrawnSeed = 4,
    securityLevel = 'strict',
    showSource = false,
    mermaidConfig = {},
  } = options;

  let instance: MermaidLike | null = null;
  let stopWatching: (() => void) | null = null;
  let fontsReady = false;

  /**
   * Mermaid measures node-label widths against whatever font is active at
   * render time. On a first page load the webfont usually has not arrived
   * yet, so labels get measured against the fallback font and end up
   * truncated in the rendered SVG. Waiting for document.fonts.ready once,
   * before the first render, avoids that race. document.fonts is absent in
   * some environments, so this is guarded rather than assumed, and it only
   * runs once: after fonts have loaded they stay loaded, so re-renders
   * (theme switches in particular) should not pay this cost again.
   */
  async function ensureFontsReady(): Promise<void> {
    if (fontsReady) return;
    fontsReady = true;
    if (typeof document === 'undefined' || !document.fonts) return;
    try {
      await document.fonts.ready;
    } catch {
      // Never let a font-loading failure block rendering.
    }
  }

  /** Put a wrapper around a bare diagram so consumers get one stable hook. */
  function wrap(container: HTMLElement): HTMLElement {
    const parent = container.parentElement;
    if (parent?.classList.contains(WRAP_CLASS)) return parent;
    const wrapper = document.createElement('div');
    wrapper.className = WRAP_CLASS;
    container.replaceWith(wrapper);
    wrapper.append(container);
    return wrapper;
  }

  async function render(): Promise<void> {
    instance ??= await resolveMermaid(provided, cdnUrl);
    if (!instance) {
      console.warn('[mermaid-doodle] no mermaid instance available, diagrams left as text');
      return;
    }

    await ensureFontsReady();

    const found = collectSources(root, selector);
    if (found.length === 0) return;

    const nodes: HTMLElement[] = [];

    for (const { container, source } of found) {
      const wrapper = wrap(container);

      const wants = showSource || wrapper.hasAttribute(SOURCE_ATTR) || container.hasAttribute(SOURCE_ATTR);
      if (wants && !wrapper.querySelector(':scope > .doodle-source')) {
        wrapper.insertBefore(buildSourceView(source), container);
      }

      // Reset to plain text: this clears highlighter markup on the first pass
      // and a previously rendered SVG on later ones.
      container.textContent = source;
      container.removeAttribute('data-processed');
      nodes.push(container);
    }

    const palette = paletteFromVars((name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name),
    );

    instance.initialize({
      startOnLoad: false,
      securityLevel,
      look,
      handDrawnSeed,
      theme: 'base',
      fontFamily: palette.font,
      themeVariables: toThemeVariables(palette),
      flowchart: { curve: 'basis', padding: 16, htmlLabels: true },
      ...mermaidConfig,
    });

    await instance.run({ nodes, suppressErrors: true });
  }

  return {
    render,
    async mount() {
      await render();
      stopWatching ??= watchTheme(() => {
        void render();
      });
    },
    destroy() {
      stopWatching?.();
      stopWatching = null;
    },
  };
}
