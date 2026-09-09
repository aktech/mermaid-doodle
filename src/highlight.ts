/**
 * Minimal Mermaid syntax highlighter for the show-source panel.
 *
 * Pass ordering is load-bearing. The keyword pass runs first, before any
 * class="..." markup exists in the string, so the keyword "class" cannot
 * match inside the spans the later passes read over. Quotes are escaped to
 * &#34; for the same reason: the string pass looks for &#34;, which never
 * appears in injected markup.
 *
 * The keyword pass carries a negative lookbehind, (?<!%%[^\n]*), so a
 * plain word that also happens to be a keyword (for example "note") is
 * not highlighted when it occurs after a %% comment marker on the same
 * line. Without it, the comment pass would wrap an already-injected
 * keyword span, producing nested markup instead of a single comment span.
 */

const KEYWORDS =
  /\b(?<!%%[^\n]*)(flowchart|graph|subgraph|end|direction|sequenceDiagram|participant|actor|loop|alt|opt|else|par|note|over|activate|deactivate|classDiagram|classDef|class|stateDiagram-v2|stateDiagram|state|erDiagram|gantt|pie|journey|gitGraph|TB|TD|BT|RL|LR)\b/g;
const COMMENT = /(^|\n)(%%[^\n]*)/g;
const STRING = /(&#34;[^&]*?&#34;)/g;
const OPERATOR = /(--?(?:&gt;){1,2}|-\.-(?:&gt;)|={2,3}(?:&gt;)|--[xo]|:::|\|)/g;

export function escapeHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&#34;');
}

export function highlight(source: string): string {
  let html = escapeHtml(source);
  html = html.replace(KEYWORDS, '<span class="doodle-hl-k">$1</span>');
  html = html.replace(COMMENT, '$1<span class="doodle-hl-c">$2</span>');
  html = html.replace(STRING, '<span class="doodle-hl-s">$1</span>');
  html = html.replace(OPERATOR, '<span class="doodle-hl-o">$1</span>');
  return html;
}
