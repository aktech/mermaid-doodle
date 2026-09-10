import test from 'node:test';
import assert from 'node:assert/strict';
import { normalisePaletteColours, type ColourConverter } from './colour.ts';
import type { DoodlePalette } from './palette.ts';

const base: DoodlePalette = {
  bg: '#ffffff',
  accent: '#5b3cc4',
  nodeBg: '#ece7f8',
  nodeText: '#241b3d',
  altBg: '#f5f3ff',
  altBorder: '#a5b4fc',
  clusterBg: '#fafafa',
  clusterBorder: '#d4d4d8',
  tertiaryBg: '#fafafa',
  tertiaryText: '#27272a',
  noteBg: '#f5f3ff',
  text: '#27272a',
  edgeLabelBg: '#ffffff',
  font: '"Shantell Sans", cursive',
};

const upper: ColourConverter = (v) => v.toUpperCase();

test('converts every colour field through the given converter', () => {
  const result = normalisePaletteColours(base, upper);
  for (const key of Object.keys(base) as (keyof DoodlePalette)[]) {
    if (key === 'font') continue;
    assert.equal(result[key], base[key].toUpperCase());
  }
});

test('never passes the font stack through the converter', () => {
  const result = normalisePaletteColours(base, upper);
  assert.equal(result.font, base.font);
});

test('transparent survives unconverted', () => {
  const result = normalisePaletteColours({ ...base, bg: 'transparent' }, upper);
  assert.equal(result.bg, 'transparent');
});

test('a value the converter decided to leave alone stays as the converter returned it', () => {
  // Simulates a real converter's own "could not parse, pass it through
  // unchanged" contract: the pure function does not second-guess this.
  const passthroughForOne: ColourConverter = (v) => (v === 'not-a-colour' ? v : v.toUpperCase());
  const result = normalisePaletteColours({ ...base, accent: 'not-a-colour' }, passthroughForOne);
  assert.equal(result.accent, 'not-a-colour');
  assert.equal(result.bg, base.bg.toUpperCase());
});

test('a converter that throws leaves that field exactly as it was', () => {
  const throws: ColourConverter = () => {
    throw new Error('boom');
  };
  const result = normalisePaletteColours(base, throws);
  assert.deepEqual(result, base);
});
