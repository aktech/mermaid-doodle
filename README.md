# mermaid-doodle

Hand-drawn Mermaid diagrams for any static site, themed from CSS custom
properties. Works with Hugo, Astro, Jekyll, MkDocs, or a plain HTML page.

## Install

```bash
npm install mermaid-doodle mermaid
```

Requires mermaid 11 or newer (peer dependency, `>=11`). The test suite
develops and verifies against mermaid 11.17.2 specifically.

This is browser JavaScript and needs no particular Node version to use, so
the package declares no `engines`. Working on the package itself does need
Node 22.18 or newer: `npm test` runs `node --test` straight over the
TypeScript sources and relies on native type stripping.

## Use it

Bundler or framework:

```js
import { createRenderer } from 'mermaid-doodle';
import 'mermaid-doodle/styles.css';

createRenderer().mount();
```

Mounting on a page with no diagram on it costs nothing: the renderer looks
for diagrams before it resolves mermaid, and returns without loading
anything if there are none. You do not need to gate the call yourself.

### Self-mounting entry

`mermaid-doodle/auto` is the same thing with no call to write. Importing it
mounts a renderer once the document is ready, reading its options from
`window.mermaidDoodleConfig` if the page set one:

```js
import 'mermaid-doodle/auto';
import 'mermaid-doodle/styles.css';
```

It is a side-effect import: it mounts, and exports nothing. Use the core
entry instead when you want control over when rendering happens.

### Plain page

`dist/auto.iife.js` is the same self-mounting entry built as a classic
script, for pages with no bundler and no module resolution. It is not
something a browser can fetch out of `node_modules` on its own: copy it (or
serve it) from wherever your site serves static files. If your build can
resolve a package export, it is `mermaid-doodle/auto.iife.js`.

```html
<link rel="stylesheet" href="/js/mermaid-doodle/styles.css">
<script src="/js/mermaid.min.js" defer></script>
<script src="/js/mermaid-doodle/auto.iife.js" defer></script>
```

This build takes no imports, so it reads options off
`window.mermaidDoodleConfig` instead of a `createRenderer()` call. Set it
before the deferred scripts run so it is there by the time `auto.iife.js`
mounts:

```html
<script>
  window.mermaidDoodleConfig = {
    showSource: true,
    cdnUrl: null, // this page vendors mermaid itself; never fetch a CDN copy
  };
</script>
<link rel="stylesheet" href="/js/mermaid-doodle/styles.css">
<script src="/js/mermaid.min.js" defer></script>
<script src="/js/mermaid-doodle/auto.iife.js" defer></script>
```

`window.mermaidDoodleConfig` accepts the same options as `createRenderer()`,
listed under Options below.

### Markup shapes

Any of these is picked up automatically:

- `pre.mermaid` and `div.mermaid`
- `[data-language="mermaid"]` (Astro Shiki, Expressive Code, Starlight)
- `code.language-mermaid`, resolved to its parent `<pre>` (Prism, Rouge, highlight.js)

## Theming

Colours come from CSS custom properties read off the page when a diagram
renders. Set them per theme and the diagrams follow, with no JavaScript
configuration. Any colour syntax the browser understands works, including
`oklch()`, `lab()`, and `color-mix()`: values are normalised before Mermaid
ever sees them, since Mermaid's own colour library only parses the legacy
forms.

```css
:root {
  --doodle-accent: #5b3cc4;
  --doodle-node-bg: #ece7f8;
  --doodle-node-text: #241b3d;
}
[data-theme="dark"] {
  --doodle-accent: #8b5cf6;
  --doodle-node-bg: #1c1633;
  --doodle-node-text: #ededef;
}
```

Every variable is optional:

| Variable | Meaning |
| --- | --- |
| `--doodle-accent` | Line colour and node border |
| `--doodle-node-bg` | Node fill |
| `--doodle-node-text` | Node label colour |
| `--doodle-alt-bg` | Secondary node fill |
| `--doodle-alt-border` | Secondary node border |
| `--doodle-cluster-bg` | Subgraph fill |
| `--doodle-cluster-border` | Subgraph border |
| `--doodle-tertiary-bg` | Tertiary fill, defaults to the cluster fill |
| `--doodle-tertiary-text` | Tertiary text, defaults to the body text colour |
| `--doodle-note-bg` | Note fill |
| `--doodle-text` | Body text colour |
| `--doodle-edge-label-bg` | Edge label backdrop |
| `--doodle-bg` | Diagram background, `transparent` by default |
| `--doodle-font` | Diagram font stack |

Fonts are yours to load. Point `--doodle-font` at whatever the page already
has; nothing is fetched on your behalf.

The theme is whatever `data-theme="light"` or `data-theme="dark"` says on
the root element, then a `dark` class on it, and failing both, the operating
system's `prefers-color-scheme`. `mount()` re-renders on any of those
changing. Renders are serialised, so two quick theme changes always leave
the diagram in the theme asked for last.

## Showing the source

Add `data-doodle-source` to a diagram or its wrapper to show a copyable,
highlighted source panel above it, or pass `showSource: true` to do it for
every diagram.

The panel has its own colours, separate from the diagram palette, so it
stays readable whatever the surrounding page does. Each has a default that
suits a light page; set the variable to change it.

| Variable | Meaning | Default |
| --- | --- | --- |
| `--doodle-source-bg` | Panel background | `#fafafa` |
| `--doodle-source-text` | Panel text | `#27272a` |
| `--doodle-source-border` | Panel border, header rule, copy button border | `#d4d4d8` |
| `--doodle-source-keyword` | Highlighted keywords | `#7c3aed` |
| `--doodle-source-string` | Highlighted strings | `#15803d` |
| `--doodle-source-comment` | Highlighted comments | `#71717a` |
| `--doodle-source-operator` | Highlighted arrows and operators | `#0369a1` |

## What ends up in your HTML

Rendering rewrites the markup around each diagram. These names are a
contract: style against them, and expect them to stay put.

| Class | Where |
| --- | --- |
| `doodle-wrap` | Wrapper div put around every diagram container |
| `doodle-diagram` | Added to every container the renderer claims. `styles.css` uses it to hide a diagram until mermaid has finished with it |
| `doodle-source` | The source panel |
| `doodle-source__head` | Panel header row |
| `doodle-source__lang` | Language label in the header |
| `doodle-source__pre` | The `<pre>` holding the highlighted source |
| `doodle-copy` | Copy button |
| `doodle-copy__copy` | Copy icon inside the button |
| `doodle-copy__check` | Confirmation tick inside the button |
| `is-copied` | On `doodle-copy` for a moment after a successful copy |
| `doodle-hl-k` | Highlighted keyword |
| `doodle-hl-c` | Highlighted comment |
| `doodle-hl-s` | Highlighted string |
| `doodle-hl-o` | Highlighted operator |

Two attributes matter as well:

- `data-doodle-source`, which you set, on a diagram or its wrapper, to ask
  for the source panel.
- `data-doodle-src`, which the package sets, on every container it has
  collected. It holds that diagram's source text, because rendering
  replaces the container's content with an SVG and the text would otherwise
  be gone by the next render. It is also how a container stays findable
  after rendering has removed whatever markup first identified it. Note
  that this puts the diagram source into the DOM as an attribute value,
  where anything reading the page can see it.

## Options

```js
createRenderer({
  root: document,          // where to look for diagrams
  selector: undefined,     // override the markup shapes above
  mermaid: undefined,      // supply an instance instead of resolving one
  cdnUrl: 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs',
                            // the CDN fallback, pinned to an exact version;
                            // set to null to refuse it
  look: 'handDrawn',       // or 'classic'
  handDrawnSeed: 4,
  securityLevel: 'strict',
  showSource: false,
  mermaidConfig: {},       // merged last, overrides everything above
});
```

`mount()` renders and then follows theme changes; `destroy()` stops
following. `render()` is the one-shot version. A render that fails is
reported with `console.warn` and does not stop later renders.

Mermaid itself is never bundled. It is resolved at runtime: an instance you
pass in, then `window.mermaid`, then a bare `import('mermaid')`, then the
CDN URL shown above, which you can refuse with `cdnUrl: null`.

### What is passed to mermaid

Besides the options above, every render calls `mermaid.initialize()` with:

```js
{
  startOnLoad: false,
  theme: 'base',                 // required: the palette below replaces it
  fontFamily: /* --doodle-font */,
  themeVariables: /* built from the --doodle-* variables */,
  flowchart: { curve: 'basis', padding: 16, htmlLabels: true },
}
```

`theme: 'base'` is what makes `themeVariables` take effect at all, so
overriding it with a named mermaid theme discards the CSS-driven palette
this package exists to apply.

`mermaidConfig` is merged **shallowly**, one level deep. A key you set
replaces the whole value above it rather than merging into it, so
`mermaidConfig: { flowchart: { padding: 4 } }` also drops `curve: 'basis'`
and `htmlLabels: true`. Restate the values you want to keep:

```js
mermaidConfig: { flowchart: { curve: 'basis', padding: 4, htmlLabels: true } }
```

## API surface

The supported API is `createRenderer`, its `DoodleOptions`,
`DoodleRenderer` and `MermaidLike` types, the `mermaid-doodle/auto` entry,
the stylesheet, and the CSS classes and attributes listed above.

The entry point also exports the pieces the renderer is built from:
`collectSources`, `extractSource`, `DEFAULT_SELECTOR`, `currentTheme`,
`watchTheme`, `buildSourceView`, `highlight`, `escapeHtml`,
`resolveMermaid`, `DEFAULT_CDN_URL`, `paletteFromVars`, `toThemeVariables`,
`DEFAULT_PALETTE`, `VAR_NAMES`, `normalisePaletteColours` and
`createCanvasColourConverter`. They are exported because they are useful on
their own, and they are documented by their types and source comments
rather than here. Until 1.0 they are internal: they can change shape in any
release, and semantic versioning does not cover them.

## Licence

MIT
