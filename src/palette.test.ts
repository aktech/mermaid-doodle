import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PALETTE,
  paletteFromVars,
  toThemeVariables,
} from './palette.ts';

const none = () => '';

test('falls back to defaults when no variables are set', () => {
  assert.deepEqual(paletteFromVars(none), DEFAULT_PALETTE);
});

test('reads set variables and trims whitespace', () => {
  const vars: Record<string, string> = {
    '--doodle-accent': '  #5b3cc4 ',
    '--doodle-node-bg': '#ece7f8',
  };
  const p = paletteFromVars((name) => vars[name] ?? '');
  assert.equal(p.accent, '#5b3cc4');
  assert.equal(p.nodeBg, '#ece7f8');
  assert.equal(p.text, DEFAULT_PALETTE.text);
});

test('tertiary values fall back to cluster and text when unset', () => {
  const vars: Record<string, string> = {
    '--doodle-cluster-bg': '#100c1c',
    '--doodle-text': '#dcdce2',
  };
  const p = paletteFromVars((name) => vars[name] ?? '');
  assert.equal(p.tertiaryBg, '#100c1c');
  assert.equal(p.tertiaryText, '#dcdce2');
});

test('tertiary values win over the fallback when explicitly set', () => {
  const vars: Record<string, string> = {
    '--doodle-cluster-bg': '#100c1c',
    '--doodle-tertiary-bg': '#14101f',
  };
  const p = paletteFromVars((name) => vars[name] ?? '');
  assert.equal(p.tertiaryBg, '#14101f');
});

test('maps the palette onto mermaid theme variable names', () => {
  const p = paletteFromVars(none);
  const tv = toThemeVariables(p);
  assert.equal(tv.lineColor, p.accent);
  assert.equal(tv.nodeBorder, p.accent);
  assert.equal(tv.primaryBorderColor, p.accent);
  assert.equal(tv.noteBorderColor, p.accent);
  assert.equal(tv.primaryColor, p.nodeBg);
  assert.equal(tv.primaryTextColor, p.nodeText);
  assert.equal(tv.secondaryTextColor, p.nodeText);
  assert.equal(tv.noteTextColor, p.nodeText);
  assert.equal(tv.secondaryColor, p.altBg);
  assert.equal(tv.secondaryBorderColor, p.altBorder);
  assert.equal(tv.tertiaryColor, p.tertiaryBg);
  assert.equal(tv.tertiaryTextColor, p.tertiaryText);
  assert.equal(tv.tertiaryBorderColor, p.clusterBorder);
  assert.equal(tv.clusterBkg, p.clusterBg);
  assert.equal(tv.clusterBorder, p.clusterBorder);
  assert.equal(tv.noteBkgColor, p.noteBg);
  assert.equal(tv.textColor, p.text);
  assert.equal(tv.edgeLabelBackground, p.edgeLabelBg);
  assert.equal(tv.background, p.bg);
});
