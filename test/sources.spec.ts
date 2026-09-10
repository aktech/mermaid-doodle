import { expect, test } from '@playwright/test';

const EXPECTED = 'graph LR\n  A --> B';
const EXPECTED_BLANK = 'graph LR\n  A --> B\n\n  C --> D';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixtures/sources.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('finds every diagram exactly once', async ({ page }) => {
  const ids = await page.evaluate(() =>
    (window as any).doodle.collectSources().map((s: any) => s.container.id),
  );
  expect(ids).toEqual([
    'plain', 'shiki', 'ec', 'prism', 'ec-blank', 'ec-gutter', 'prism-dual',
  ]);
});

test('extracts identical source from all four markup shapes', async ({ page }) => {
  const sources = await page.evaluate(() =>
    (window as any).doodle.collectSources().map((s: any) => s.source),
  );
  expect(sources).toEqual([
    EXPECTED, EXPECTED, EXPECTED, EXPECTED, EXPECTED_BLANK, EXPECTED, EXPECTED,
  ]);
});

test('uses the pre as the container for a highlighted code child', async ({ page }) => {
  const tags = await page.evaluate(() =>
    (window as any).doodle.collectSources().map((s: any) => s.container.tagName),
  );
  expect(tags).toEqual(['PRE', 'PRE', 'PRE', 'PRE', 'PRE', 'PRE', 'PRE']);
});

test('stashes the source so a second collect survives rendered output', async ({ page }) => {
  await page.evaluate(() => {
    (window as any).doodle.collectSources();
    // Simulate mermaid replacing the element's content with an SVG.
    document.querySelector('#plain')!.innerHTML = '<svg><g></g></svg>';
  });
  const source = await page.evaluate(
    () => (window as any).doodle.collectSources()[0].source,
  );
  expect(source).toBe(EXPECTED);
});

test('preserves an interior blank line without doubling it (Expressive Code)', async ({ page }) => {
  const source = await page.evaluate(() => {
    const all = (window as any).doodle.collectSources();
    return all.find((s: any) => s.container.id === 'ec-blank').source;
  });
  expect(source).toBe(EXPECTED_BLANK);
});

test('does not leak Expressive Code gutter line numbers into the source', async ({ page }) => {
  const source = await page.evaluate(() => {
    const all = (window as any).doodle.collectSources();
    return all.find((s: any) => s.container.id === 'ec-gutter').source;
  });
  expect(source).toBe(EXPECTED);
});

test('dedupes an element that matches two selector clauses at once', async ({ page }) => {
  const matches = await page.evaluate(() => {
    const all = (window as any).doodle.collectSources();
    return all.filter((s: any) => s.container.id === 'prism-dual').length;
  });
  expect(matches).toBe(1);
});
