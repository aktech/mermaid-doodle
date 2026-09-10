import { paletteFromVars, toThemeVariables } from './palette.ts';
import { collectSources, CLAIMED_SELECTOR, DEFAULT_SELECTOR } from './sources.ts';
import { buildSourceView } from './source-view.ts';
import { watchTheme } from './theme.ts';
import { resolveMermaid, DEFAULT_CDN_URL, type MermaidLike } from './mermaid-loader.ts';
import { normalisePaletteColours, type ColourConverter } from './colour.ts';
import { createCanvasColourConverter } from './colour-canvas.ts';

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
// Anti-flash hook: styles.css hides any element carrying this class until
// mermaid marks it data-processed. Applied to every container regardless of
// which of the four DEFAULT_SELECTOR shapes it came in as, so the hide
// works the same way for a Starlight [data-language="mermaid"] block as for
// a Darby pre.mermaid one, instead of covering only the shape src/styles.css
// happened to enumerate.
const DIAGRAM_CLASS = 'doodle-diagram';

// CSS Fonts Level 4 generic family keywords: none of these name an
// installable webfont, so there is nothing for document.fonts.load to
// usefully request.
const GENERIC_FONT_FAMILIES = new Set([
  'serif', 'sans-serif', 'cursive', 'fantasy', 'monospace',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'emoji', 'math', 'fangsong',
]);

/**
 * The first family in a CSS font-family list (e.g. from --doodle-font),
 * unquoted, or null if it is a generic keyword or the list is empty. Handles
 * both a quoted family containing spaces (`"Shantell Sans", cursive`) and an
 * unquoted one (`Arial, sans-serif`).
 */
function firstFontFamily(fontStack: string): string | null {
  const first = (fontStack.split(',')[0] ?? '').trim();
  const unquoted = first.replace(/^["']|["']$/g, '').trim();
  if (!unquoted || GENERIC_FONT_FAMILIES.has(unquoted.toLowerCase())) return null;
  return unquoted;
}

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

  // Every render collects with the markup shapes AND with "already claimed",
  // because rendering can remove the very thing that made a container match a
  // markup shape: for code.language-mermaid the container is the parent <pre>
  // and rendering replaces the <code class="language-mermaid"> child. Without
  // the second clause that container is invisible from the second render on,
  // so it silently keeps the first theme's palette forever.
  const collectSelector = `${selector}, ${CLAIMED_SELECTOR}`;

  let instance: MermaidLike | null = null;
  let stopWatching: (() => void) | null = null;
  let fontsReady = false;
  let colourConverter: ColourConverter | null = null;

  /**
   * Mermaid measures node-label widths against whatever font is active at
   * render time. document.fonts.ready alone does not guarantee the real
   * font is that font: it resolves once loading finishes for fonts the
   * document has already requested, and on a first render nothing has used
   * the diagram's font family yet, so nothing has requested it, so
   * document.fonts.ready resolves immediately against the fallback font,
   * and the real font only arrives (and reflows label boxes sized for the
   * wrong metrics) afterwards. Explicitly requesting the resolved family
   * with document.fonts.load before waiting on document.fonts.ready is what
   * actually forces the browser to fetch it first.
   *
   * document.fonts is absent in some environments and a font request can
   * fail or throw, so both steps are guarded; a missing or failing font
   * falls back to whatever is available today rather than blocking or
   * breaking rendering. This runs once: after fonts have loaded they stay
   * loaded, so re-renders (theme switches in particular) should not pay
   * this cost again.
   */
  async function ensureFontsReady(fontStack: string): Promise<void> {
    if (fontsReady) return;
    fontsReady = true;
    if (typeof document === 'undefined' || !document.fonts) return;

    const family = firstFontFamily(fontStack);
    if (family) {
      try {
        await document.fonts.load(`1em "${family}"`);
      } catch {
        // A failed explicit request falls back to whatever is available;
        // the ready wait below still runs in case something else is
        // already in flight.
      }
    }

    try {
      await document.fonts.ready;
    } catch {
      // Never let this block rendering.
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
    // Look for work before resolving mermaid, never the other way round.
    // Resolving first means every page of a site pays for mermaid (a ~3 MB
    // dynamic import, or a CDN fetch) even when it has no diagram on it at
    // all, which leaves consumers writing their own presence gates just to
    // avoid the download.
    const found = collectSources(root, collectSelector);
    if (found.length === 0) return;

    instance ??= await resolveMermaid(provided, cdnUrl);
    if (!instance) {
      console.warn('[mermaid-doodle] no mermaid instance available, diagrams left as text');
      return;
    }

    const nodes: HTMLElement[] = [];

    for (const { container, source } of found) {
      // classList.add is a no-op if the class is already there, so this
      // stays correct across re-renders without any extra bookkeeping.
      container.classList.add(DIAGRAM_CLASS);
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

    await ensureFontsReady(palette.font);

    // Mermaid's own colour library cannot parse every colour syntax a site
    // might write --doodle-* in (oklch(), lab(), color-mix(), ...), so run
    // the colour fields through a converter first. The converter itself is
    // created once and reused: it is stateless with respect to any single
    // palette value, and recreating its backing canvas on every render
    // would be wasted work.
    colourConverter ??= createCanvasColourConverter();
    const colours = normalisePaletteColours(palette, colourConverter);

    instance.initialize({
      startOnLoad: false,
      securityLevel,
      look,
      handDrawnSeed,
      theme: 'base',
      fontFamily: palette.font,
      themeVariables: toThemeVariables(colours),
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
