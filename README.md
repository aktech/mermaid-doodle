# mermaid-doodle

Hand-drawn Mermaid diagrams for any static site, themed from CSS custom
properties. Works with Hugo, Astro, Jekyll, MkDocs, or a plain HTML page.

## Install

```bash
npm install mermaid-doodle mermaid
```

Requires mermaid 11 or newer (peer dependency, `>=11`).

## Use it

Bundler or framework:

```js
import { createRenderer } from 'mermaid-doodle';
import 'mermaid-doodle/styles.css';

createRenderer().mount();
```

Plain page, with mermaid already loaded:

```html
<link rel="stylesheet" href="/js/mermaid-doodle/styles.css">
<script src="/js/mermaid.min.js" defer></script>
<script src="/js/mermaid-doodle/auto.iife.js" defer></script>
```

Any of these markup shapes is picked up automatically:

- `pre.mermaid` and `div.mermaid`
- `[data-language="mermaid"]` (Astro Shiki, Expressive Code, Starlight)
- `pre > code.language-mermaid` (Prism, Rouge, highlight.js)

## Theming

Colours come from CSS custom properties read off the page when a diagram
renders. Set them per theme and the diagrams follow, with no JavaScript
configuration:

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

## Showing the source

Add `data-doodle-source` to a diagram or its wrapper to show a copyable,
highlighted source panel above it, or pass `showSource: true` to do it for
every diagram.

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
following. `render()` is the one-shot version.

Mermaid itself is never bundled. It is resolved at runtime: an instance you
pass in, then `window.mermaid`, then a bare `import('mermaid')`, then the
CDN URL shown above, which you can refuse with `cdnUrl: null`.

## Licence

MIT
