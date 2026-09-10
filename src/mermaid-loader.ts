export interface MermaidLike {
  initialize(config: Record<string, unknown>): void;
  run(options: { nodes?: ArrayLike<HTMLElement>; suppressErrors?: boolean }): Promise<void> | void;
}

// Pinned to an exact version rather than a floating major: this URL is
// remote executable code fetched at run time, and a floating major (e.g.
// mermaid@11) resolves to whatever is newest whenever a browser hits it.
export const DEFAULT_CDN_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs';

function unwrap(mod: unknown): MermaidLike | null {
  const candidate = (mod as { default?: unknown })?.default ?? mod;
  return candidate && typeof (candidate as MermaidLike).run === 'function'
    ? (candidate as MermaidLike)
    : null;
}

/**
 * Resolve a mermaid instance without bundling one.
 *
 * Order: an instance the caller passed in, a global the page already loaded
 * (Darby vendors mermaid and loads it first, so it never goes further than
 * this), a bare import for bundler consumers, and only then a CDN URL for
 * plain script-tag pages that have no module resolution at all.
 */
export async function resolveMermaid(
  provided?: MermaidLike,
  cdnUrl: string | null = DEFAULT_CDN_URL,
): Promise<MermaidLike | null> {
  if (provided) return provided;

  const global = unwrap((globalThis as { mermaid?: unknown }).mermaid);
  if (global) return global;

  try {
    return unwrap(await import('mermaid'));
  } catch {
    // No bare specifier resolution here (IIFE build in a plain page).
  }

  if (cdnUrl) {
    try {
      return unwrap(await import(/* @vite-ignore */ cdnUrl));
    } catch {
      // Fall through to null: the caller reports rather than throwing.
    }
  }

  return null;
}
