export interface DiagramSource {
  container: HTMLElement;
  source: string;
}

/**
 * Markup shapes that carry a mermaid fence:
 *   pre.mermaid / div.mermaid   Hugo, Darby, mermaid's own convention
 *   [data-language="mermaid"]   Astro Shiki and Expressive Code
 *   code.language-mermaid       Prism, Rouge, highlight.js
 */
export const DEFAULT_SELECTOR =
  'pre.mermaid, div.mermaid, [data-language="mermaid"], code.language-mermaid';

const STASH = 'doodleSrc';

/**
 * Read the diagram text out of a node that may be plain text or highlighted
 * markup.
 *
 * textContent is right for plain fences and for Shiki's classic structure,
 * which puts a real newline text node between lines. Expressive Code does
 * not: it emits one div.ec-line per line and only inserts a newline for
 * empty lines, so textContent returns the whole diagram on one line. When
 * the text has no newline but the node has more than one line element, the
 * source is rebuilt from those.
 */
export function extractSource(el: Element): string {
  const text = el.textContent ?? '';
  if (!text.includes('\n')) {
    const lines = el.querySelectorAll('.ec-line, .line');
    if (lines.length > 1) {
      return Array.from(lines, (line) => line.textContent ?? '').join('\n').replace(/\s+$/, '');
    }
  }
  return text.replace(/\s+$/, '');
}

function containerFor(el: Element): HTMLElement | null {
  // A highlighted <code> lives inside the <pre> that carries the framing and
  // the attributes, so the <pre> is what gets wrapped and re-rendered.
  const node = el.tagName === 'CODE' && el.parentElement?.tagName === 'PRE'
    ? el.parentElement
    : el;
  return node instanceof HTMLElement ? node : null;
}

export function collectSources(
  root: ParentNode = document,
  selector: string = DEFAULT_SELECTOR,
): DiagramSource[] {
  const seen = new Set<HTMLElement>();
  const found: DiagramSource[] = [];

  for (const match of root.querySelectorAll(selector)) {
    const container = containerFor(match);
    if (!container || seen.has(container)) continue;
    seen.add(container);

    // Stash on first sight. After mermaid replaces the content with an SVG
    // the original text is gone, so re-renders read the stash instead.
    const stashed = container.dataset[STASH];
    const source = stashed ?? extractSource(container);
    if (stashed === undefined) container.dataset[STASH] = source;

    found.push({ container, source });
  }

  return found;
}
