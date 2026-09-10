import { expect, test } from '@playwright/test';

test('the first render waits for document.fonts.ready before running mermaid', async ({ page }) => {
  await page.goto('/test/fixtures/render-fonts.html');
  await page.waitForFunction(() => (window as any).ready === true);

  // Give any (wrongly) un-awaited render a chance to run.
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(0);

  await page.evaluate(() => (window as any).resolveFonts());
  await page.evaluate(() => (window as any).mountPromise);
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(1);
});

test('a later render does not wait for fonts again', async ({ page }) => {
  await page.goto('/test/fixtures/render-fonts.html');
  await page.waitForFunction(() => (window as any).ready === true);
  await page.evaluate(() => (window as any).resolveFonts());
  await page.evaluate(() => (window as any).mountPromise);
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(1);

  // Swap in a fonts.ready that never resolves. If render() re-awaited it,
  // this call would hang forever.
  await page.evaluate(() => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise(() => {}) },
    });
  });
  await page.evaluate(() => (window as any).renderer.render());
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(2);
});

test('does not hang or throw when document.fonts is unavailable', async ({ page }) => {
  await page.goto('/test/fixtures/render-fonts-none.html');
  await page.waitForFunction(() => (window as any).ready === true);
  await page.evaluate(() => (window as any).mountPromise);
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(1);
});
