import { expect, test } from '@playwright/test';

const nodeLabelFont = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const label = document.querySelector('#d1 .nodeLabel');
    return label ? getComputedStyle(label).fontFamily : null;
  });

test('a window "load" event racing in mid-render does not strand the diagram in mermaid default font', async ({ page }) => {
  await page.goto('/test/fixtures/render-font-race.html');
  await page.locator('body[data-ready="true"]').waitFor();

  // Mermaid registers its own `window.addEventListener('load', ...)` that,
  // if `startOnLoad` is still true in mermaid's live config at that moment,
  // auto-runs mermaid.run() with no arguments over every unclaimed
  // `.mermaid` element using whatever theme is live right then. Our own
  // render is deliberately still parked on the (stubbed) font-loading
  // await here, simulating a real page where document.fonts.load() for a
  // webfont takes long enough for the page's "load" event (which a
  // <link rel="stylesheet"> webfont also blocks) to land first. Dispatching
  // "load" here is what actually exercises that race deterministically,
  // rather than depending on a real network delay.
  await page.evaluate(() => window.dispatchEvent(new Event('load')));

  await page.evaluate(() => (window as any).resolveFontLoad());
  await page.evaluate(() => (window as any).mountPromise);

  expect(await nodeLabelFont(page)).toBe('"Test Doodle Font", cursive');
});

test('the default font stack still renders when --doodle-font is not set', async ({ page }) => {
  await page.goto('/test/fixtures/render-font-default.html');
  await page.locator('body[data-ready="true"]').waitFor();

  const defaultFont = await page.evaluate(() => (window as any).DEFAULT_PALETTE.font);

  expect(await nodeLabelFont(page)).toBe(defaultFont);
});
