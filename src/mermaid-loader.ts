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
 * True in the ESM build, false in the IIFE build. tsup substitutes this via
 * esbuild's `define` (see tsup.config.ts), so the bare-import branch below
 * is a compile-time constant, not a runtime check.
 *
 * The bare specifier has to stay a literal `import('mermaid')` for a
 * bundler consumer (Vite, webpack) to see and resolve it against the copy
 * of mermaid that consumer installed. But that same literal is exactly
 * what made esbuild bundle the whole of mermaid into the IIFE build
 * instead of leaving it external (a plain browser page has no resolver for
 * a bare specifier, so esbuild pulled the dependency in rather than leave
 * an unresolvable import behind). Folding this constant to `false` for the
 * IIFE build lets esbuild dead-code-eliminate the entire branch, literal
 * import included, so there is nothing left for it to bundle.
 */
declare const __DOODLE_BARE_IMPORT__: boolean;

/**
 * Import a module named by a specifier that is only known at run time.
 *
 * The CDN URL is a runtime string, never a literal, so no bundler can
 * resolve it at build time regardless of format. Routing it through
 * `new Function` keeps it that way defensively and stops any bundler from
 * even attempting static analysis on it.
 *
 * The helper is built here, on demand, and never at module scope. The
 * Function constructor is refused by any Content Security Policy whose
 * script-src lacks 'unsafe-eval', which is an ordinary policy for a static
 * site. At module scope that refusal throws while the bundle is still
 * evaluating, so the entire package fails to load and nothing renders at
 * all, including for a consumer who supplied mermaid directly and refused
 * the CDN with cdnUrl: null. Only the CDN branch calls this, so a page that
 * never reaches that branch never touches the Function constructor.
 */
function importAtRuntime(specifier: string): Promise<unknown> {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<unknown>;
  return dynamicImport(specifier);
}

/**
 * Resolve a mermaid instance without bundling one.
 *
 * Order: an instance the caller passed in, a global the page already loaded
 * (a site that vendors mermaid and loads it first never goes further than
 * this), a bare import for bundler consumers (ESM build only, see
 * __DOODLE_BARE_IMPORT__ above), and only then a CDN URL for plain
 * script-tag pages that have no module resolution at all.
 */
export async function resolveMermaid(
  provided?: MermaidLike,
  cdnUrl: string | null = DEFAULT_CDN_URL,
): Promise<MermaidLike | null> {
  if (provided) return provided;

  const global = unwrap((globalThis as { mermaid?: unknown }).mermaid);
  if (global) return global;

  if (__DOODLE_BARE_IMPORT__) {
    try {
      return unwrap(await import('mermaid'));
    } catch {
      // No bare specifier resolution here (no mermaid installed).
    }
  }

  if (cdnUrl) {
    try {
      // Both building the helper and running the import are inside this
      // guard, so a policy that refuses the Function constructor costs this
      // one fallback and nothing else.
      return unwrap(await importAtRuntime(cdnUrl));
    } catch {
      // Fall through to null: the caller reports rather than throwing.
    }
  }

  return null;
}
