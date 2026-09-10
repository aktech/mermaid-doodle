import type { ColourConverter } from './colour.ts';

// An assignment canvas rejects (an unparseable colour) leaves fillStyle
// holding whatever it was set to before, rather than throwing or clearing
// it. Setting this sentinel first and checking whether it survived the
// following assignment is the only reliable way to detect that rejection.
// Chosen to be a colour nobody's design tokens are realistically going to
// collide with.
const INVALID_SENTINEL = '#010203';

/**
 * A colour converter backed by a 1x1 canvas: paint the value onto it and
 * read the rasterised pixel back as a legacy rgb()/rgba() string. The
 * canvas 2D context's colour parser accepts anything the browser's CSS
 * colour parser does (oklch(), lab(), color-mix(), named colours, hex,
 * legacy rgb()/hsl(), ...), so this is what lets consumers write --doodle-*
 * custom properties in whatever colour syntax they already use, while
 * Mermaid's own, older colour library only ever sees the legacy form it can
 * parse.
 *
 * If the page has no canvas 2D context at all (getContext('2d') can return
 * null), every value is passed through unchanged rather than throwing, so
 * rendering still happens with whatever Mermaid can parse on its own.
 */
export function createCanvasColourConverter(): ColourConverter {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return (value) => value;

  return (value: string): string => {
    ctx.fillStyle = INVALID_SENTINEL;
    ctx.fillStyle = value;
    if (ctx.fillStyle === INVALID_SENTINEL) return value;

    // Clear first: this canvas is reused across every colour field, and a
    // previous semi-transparent fill would otherwise blend into this read.
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
  };
}
