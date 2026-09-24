# mermaid-doodle

Hand-drawn Mermaid diagrams for any static site, themed from CSS custom properties, with no JavaScript configuration.

<img src="https://raw.githubusercontent.com/aktech/mermaid-doodle/main/docs/media/hero-light.png" alt="A flowchart (browser to CDN to API gateway to an Auth and Render service to a database) drawn in mermaid-doodle's hand-drawn style under a light violet site theme" width="440"> <img src="https://raw.githubusercontent.com/aktech/mermaid-doodle/main/docs/media/hero-dark.png" alt="The same flowchart rendered under a dark theme, following the page's --doodle-* variables with no code change" width="440">

<img src="https://raw.githubusercontent.com/aktech/mermaid-doodle/main/docs/media/palettes.png" alt="The same diagram rendered on two different sites, one violet and one amber, each keeping its own background and accent colours" width="760">

## Install

```bash
npm install mermaid-doodle mermaid
```

Requires mermaid `>=11` (peer dependency).

## Use it

Bundler or framework:

```js
import { createRenderer } from 'mermaid-doodle';
import 'mermaid-doodle/styles.css';

createRenderer().mount();
```

Plain script tag (copy `dist/auto.iife.js` to your static files), configured through `window.mermaidDoodleConfig` since there is no `createRenderer()` call to pass options to:

```html
<script>
  window.mermaidDoodleConfig = { showSource: true };
</script>
<link rel="stylesheet" href="/js/mermaid-doodle/styles.css">
<script src="/js/mermaid.min.js" defer></script>
<script src="/js/mermaid-doodle/auto.iife.js" defer></script>
```

`window.mermaidDoodleConfig` accepts the same options as `createRenderer()`, listed under Options below.

### Markup it detects

- `pre.mermaid` and `div.mermaid`
- `[data-language="mermaid"]` (Astro Shiki, Expressive Code, Starlight)
- `code.language-mermaid`, resolved to its parent `<pre>` (Prism, Rouge, highlight.js)

## Theming

Colours come from CSS custom properties read off the page at render time, in any syntax the browser understands: `oklch()`, `lab()`, and `color-mix()` are normalised before Mermaid sees them. Every variable is optional.

| Variable | Meaning |
| --- | --- |
| `--doodle-accent` | Line colour and node border |
| `--doodle-node-bg` / `--doodle-node-text` | Node fill / label colour |
| `--doodle-alt-bg` / `--doodle-alt-border` | Secondary node fill / border |
| `--doodle-cluster-bg` / `--doodle-cluster-border` | Subgraph fill / border |
| `--doodle-tertiary-bg` / `--doodle-tertiary-text` | Tertiary fill / text; default to the cluster fill / body text |
| `--doodle-note-bg` | Note fill |
| `--doodle-text` | Body text colour |
| `--doodle-edge-label-bg` | Edge label backdrop |
| `--doodle-bg` | Diagram background, `transparent` by default |
| `--doodle-font` | Diagram font stack; nothing is fetched for you |

The source panel below has its own separate palette:

| Variable | Meaning | Default |
| --- | --- | --- |
| `--doodle-source-bg` | Panel background | `#fafafa` |
| `--doodle-source-text` | Panel text | `#27272a` |
| `--doodle-source-border` | Panel border, header rule, copy button border | `#d4d4d8` |
| `--doodle-source-keyword` / `-string` / `-comment` / `-operator` | Highlighted keyword / string / comment / operator | `#7c3aed` / `#15803d` / `#71717a` / `#0369a1` |

Theme is `data-theme="light"|"dark"` on the root element, then a `dark` class, then `prefers-color-scheme`. `mount()` re-renders on any of those changing; renders are serialised, so two quick theme changes always leave the diagram in the theme asked for last.

## Showing the source

Add `data-doodle-source` to a diagram or its wrapper for a copyable, highlighted source panel above it, or set `showSource: true` for every diagram.

<img src="https://raw.githubusercontent.com/aktech/mermaid-doodle/main/docs/media/source-panel.png" alt="A highlighted, copyable mermaid source panel with a copy button, shown above the diagram it renders" width="760">

Rendering also sets `data-doodle-src` on every container it collects, since the container's content is replaced with an SVG and the source text would otherwise be lost by the next render. This puts the diagram source into the DOM as an attribute value, where anything reading the page can see it.

## Options

```js
createRenderer({
  root: document,          // where to look for diagrams
  selector: undefined,     // override the markup shapes above
  mermaid: undefined,      // supply an instance instead of resolving one
  cdnUrl: 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs', // pinned; null refuses it
  look: 'handDrawn',       // or 'classic'
  handDrawnSeed: 4,
  securityLevel: 'strict',
  showSource: false,
  mermaidConfig: {},       // merged last, overrides everything above
});
```

`mount()` renders and follows theme changes; `destroy()` stops that; `render()` is one-shot. Mermaid is never bundled: it resolves from an instance you pass in, then `window.mermaid`, then a bare `import('mermaid')`, then the CDN URL above (`cdnUrl: null` refuses it).

## What ends up in your HTML

These names are a contract: style against them, and expect them to stay put.

- `doodle-wrap` - wrapper div put around every diagram container
- `doodle-diagram` - added to every claimed container; hidden until mermaid finishes with it
- `doodle-source`, `__head`, `__lang`, `__pre` - the source panel, its header row, language label, and highlighted `<pre>`
- `doodle-copy`, `__copy`, `__check`, `is-copied` - the copy button, its icon, its confirmation tick, and the state after a successful copy
- `doodle-hl-k` / `-c` / `-s` / `-o` - highlighted keyword / comment / string / operator

## What gets passed to mermaid

Every render also calls `mermaid.initialize()` with `theme: 'base'` (required for the palette above to apply), `fontFamily` from `--doodle-font`, `themeVariables` built from the table above, and `flowchart: { curve: 'basis', padding: 16, htmlLabels: true }`. `mermaidConfig` is merged in **shallowly**, one level deep: a key you set replaces the whole value above it rather than merging into it, so `mermaidConfig: { flowchart: { padding: 4 } }` also drops `curve: 'basis'` and `htmlLabels: true`. Restate the values you want to keep: `mermaidConfig: { flowchart: { curve: 'basis', padding: 4, htmlLabels: true } }`.

## API surface

`createRenderer` (with its `DoodleOptions`, `DoodleRenderer`, `MermaidLike` types), the `mermaid-doodle/auto` entry, the stylesheet, and the classes and attributes above are the supported API. Everything else the entry point exports is an internal building block, useful on its own but not covered by semver until 1.0.

## Licence

MIT
