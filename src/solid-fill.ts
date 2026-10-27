/**
 * In the handDrawn look mermaid never paints a node solid: it hatches the
 * fill with 4px strokes (rough.js "hachure") 5.2px apart, and none of its
 * config reaches that. On a pale default fill the gaps barely show, but on a
 * strong `style X fill:...` the label sits on stripes and breaks up.
 *
 * Each hatched node is a fill path drawn first, then its outline. Widening
 * the fill strokes past the gap makes them overlap into a solid fill while
 * the hand-drawn outline stays as it is, for every node shape.
 */
const HACHURE_WEIGHT = '4';
const SOLID_WEIGHT = '6';

export function solidifyNodeFills(root: ParentNode): void {
  const fills = root.querySelectorAll<SVGPathElement>(
    `g.rough-node path[fill="none"][stroke-width="${HACHURE_WEIGHT}"]`,
  );
  for (const path of fills) {
    if (path.nextElementSibling?.tagName.toLowerCase() !== 'path') continue;
    path.setAttribute('stroke-width', SOLID_WEIGHT);
  }
}
