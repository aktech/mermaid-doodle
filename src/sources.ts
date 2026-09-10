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
 * The decision keys off whether the node has more than one structural line
 * element (.ec-line or .line), not off whether textContent happens to
 * contain a newline. Gating on textContent is wrong: Expressive Code inserts
 * a real newline text node for an EMPTY line only (render-line.ts), so a
 * diagram with a blank line in the middle already has one newline in
 * textContent even though its non-blank lines are still glued together with
 * no separator at all. Reconstructing from the line elements themselves
 * handles that correctly, and also handles Shiki's classic structure (which
 * has no gutter and no blank-line quirk) the same way, so there is one path
 * for every highlighter that emits per-line markup.
 *
 * textContent is used directly only when there is no such per-line
 * structure: a single-line diagram, or plain unhighlighted markup.
 */
export function extractSource(el: Element): string {
  const lines = el.querySelectorAll('.ec-line, .line');
  if (lines.length > 1) {
    return Array.from(lines, lineText).join('\n').replace(/\s+$/, '');
  }
  return (el.textContent ?? '').replace(/\s+$/, '');
}

/**
 * Text of a single line element.
 *
 * Expressive Code puts an optional line-number gutter (div.gutter) before
 * the code (div.code) as a sibling inside the same line element, so prefer
 * the .code child when there is one rather than reading the whole line,
 * which would scrape the gutter digits into the source. Shiki's .line spans
 * have no such child, so they fall back to the line's own text.
 *
 * A blank line's .code div holds a literal "\n" (Expressive Code's own
 * stand-in for empty content), which is stripped here: a single line can
 * never legitimately contain a newline, and the join in extractSource is
 * what puts the line break back between lines.
 */
function lineText(line: Element): string {
  const code = line.querySelector(':scope > .code');
  const text = (code ?? line).textContent ?? '';
  return text.replace(/\n/g, '');
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
