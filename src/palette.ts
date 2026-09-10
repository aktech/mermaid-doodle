/**
 * The palette is read from CSS custom properties at render time, not stored
 * as light and dark objects in JS. The browser has already resolved which
 * [data-theme] block applies, so whatever getComputedStyle returns is
 * correct for the current theme. A theme change needs no palette logic, only
 * a re-read.
 */

export interface DoodlePalette {
  bg: string;
  accent: string;
  nodeBg: string;
  nodeText: string;
  altBg: string;
  altBorder: string;
  clusterBg: string;
  clusterBorder: string;
  tertiaryBg: string;
  tertiaryText: string;
  noteBg: string;
  text: string;
  edgeLabelBg: string;
  font: string;
}

export const VAR_NAMES: Record<keyof DoodlePalette, string> = {
  bg: '--doodle-bg',
  accent: '--doodle-accent',
  nodeBg: '--doodle-node-bg',
  nodeText: '--doodle-node-text',
  altBg: '--doodle-alt-bg',
  altBorder: '--doodle-alt-border',
  clusterBg: '--doodle-cluster-bg',
  clusterBorder: '--doodle-cluster-border',
  tertiaryBg: '--doodle-tertiary-bg',
  tertiaryText: '--doodle-tertiary-text',
  noteBg: '--doodle-note-bg',
  text: '--doodle-text',
  edgeLabelBg: '--doodle-edge-label-bg',
  font: '--doodle-font',
};

/** Neutral defaults for a site that sets no --doodle-* variables at all. */
export const DEFAULT_PALETTE: DoodlePalette = {
  bg: 'transparent',
  accent: '#4f46e5',
  nodeBg: '#eef2ff',
  nodeText: '#1e1b4b',
  altBg: '#f5f3ff',
  altBorder: '#a5b4fc',
  clusterBg: '#fafafa',
  clusterBorder: '#d4d4d8',
  tertiaryBg: '#fafafa',
  tertiaryText: '#27272a',
  noteBg: '#f5f3ff',
  text: '#27272a',
  edgeLabelBg: '#ffffff',
  font: '"Segoe Print", "Comic Sans MS", cursive',
};

export function paletteFromVars(read: (name: string) => string): DoodlePalette {
  const get = (key: keyof DoodlePalette): string =>
    read(VAR_NAMES[key]).trim() || DEFAULT_PALETTE[key];

  const clusterBg = get('clusterBg');
  const text = get('text');

  return {
    bg: get('bg'),
    accent: get('accent'),
    nodeBg: get('nodeBg'),
    nodeText: get('nodeText'),
    altBg: get('altBg'),
    altBorder: get('altBorder'),
    clusterBg,
    clusterBorder: get('clusterBorder'),
    // Tertiary is a refinement: sites that do not care get the cluster and
    // body values, sites that do can split them.
    tertiaryBg: read(VAR_NAMES.tertiaryBg).trim() || clusterBg,
    tertiaryText: read(VAR_NAMES.tertiaryText).trim() || text,
    noteBg: get('noteBg'),
    text,
    edgeLabelBg: get('edgeLabelBg'),
    font: get('font'),
  };
}

export function toThemeVariables(p: DoodlePalette): Record<string, string> {
  return {
    background: p.bg,
    primaryColor: p.nodeBg,
    primaryBorderColor: p.accent,
    primaryTextColor: p.nodeText,
    secondaryColor: p.altBg,
    secondaryBorderColor: p.altBorder,
    secondaryTextColor: p.nodeText,
    tertiaryColor: p.tertiaryBg,
    tertiaryBorderColor: p.clusterBorder,
    tertiaryTextColor: p.tertiaryText,
    lineColor: p.accent,
    textColor: p.text,
    clusterBkg: p.clusterBg,
    clusterBorder: p.clusterBorder,
    nodeBorder: p.accent,
    edgeLabelBackground: p.edgeLabelBg,
    noteBkgColor: p.noteBg,
    noteBorderColor: p.accent,
    noteTextColor: p.nodeText,
  };
}
