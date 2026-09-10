import type { DoodlePalette } from './palette.ts';
import { VAR_NAMES } from './palette.ts';

export type ColourConverter = (value: string) => string;

// Every DoodlePalette field except font: derived from VAR_NAMES, the same
// single source of truth palette.ts already keys everything else off, so
// this list cannot silently drift out of sync with the palette shape the
// way a second hand-written list would.
const COLOUR_FIELDS = (Object.keys(VAR_NAMES) as (keyof DoodlePalette)[]).filter(
  (key) => key !== 'font',
);

/**
 * Run every colour field of a palette through a converter, so consumers can
 * define --doodle-* custom properties in any CSS colour syntax the browser
 * understands (oklch(), lab(), color-mix(), named colours, ...) and still
 * end up with something Mermaid's own colour library can parse. font is a
 * font stack, not a colour, and is never passed to the converter.
 *
 * transparent is passed through untouched rather than given to the
 * converter: it is a keyword every SVG and CSS renderer already
 * understands on its own, it is this package's own default background
 * (DEFAULT_PALETTE.bg), and round-tripping it through a converter (a
 * canvas readback, for the browser-backed one) risks turning it into a
 * slightly different-looking "fully transparent" value for no benefit.
 *
 * A converter that throws or otherwise fails for a given value is not this
 * function's problem to solve: that value is left exactly as it was, so a
 * broken conversion degrades to the colour the site actually wrote, never
 * to a broken palette.
 */
export function normalisePaletteColours(
  palette: DoodlePalette,
  convert: ColourConverter,
): DoodlePalette {
  const result = { ...palette };
  for (const key of COLOUR_FIELDS) {
    const value = palette[key];
    if (value.trim().toLowerCase() === 'transparent') continue;
    try {
      result[key] = convert(value);
    } catch {
      // Leave this field exactly as it was.
    }
  }
  return result;
}
