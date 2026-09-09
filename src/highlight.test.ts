import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, highlight } from './highlight.ts';

test('escapes HTML, quoting double quotes as numeric entities', () => {
  assert.equal(escapeHtml('a<b>&"c"'), 'a&lt;b&gt;&amp;&#34;c&#34;');
});

test('wraps keywords in keyword spans', () => {
  assert.equal(
    highlight('graph LR'),
    '<span class="doodle-hl-k">graph</span> <span class="doodle-hl-k">LR</span>',
  );
});

test('wraps a full-line comment', () => {
  assert.equal(
    highlight('%% a note'),
    '<span class="doodle-hl-c">%% a note</span>',
  );
});

test('wraps a quoted string', () => {
  assert.equal(
    highlight('A["hello"]'),
    'A[<span class="doodle-hl-s">&#34;hello&#34;</span>]',
  );
});

test('wraps arrow operators', () => {
  assert.equal(
    highlight('A --> B'),
    'A <span class="doodle-hl-o">--&gt;</span> B',
  );
});

test('does not highlight inside markup it already injected', () => {
  // Regression: the keyword pass must run first, otherwise the keyword
  // "class" matches inside the class="..." attributes of earlier spans.
  const out = highlight('classDiagram\n  class Foo');
  assert.equal(
    out,
    '<span class="doodle-hl-k">classDiagram</span>\n  <span class="doodle-hl-k">class</span> Foo',
  );
  assert.equal(out.match(/doodle-hl-k/g)?.length, 2);
});
