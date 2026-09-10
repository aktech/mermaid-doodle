import { expect, test } from '@playwright/test';

// The fixture's --doodle-accent per theme, as the canvas converter normalises
// them, which is what reaches mermaid as themeVariables.lineColor.
const LIGHT_LINE = 'rgb(91, 60, 196)';
const DARK_LINE = 'rgb(139, 92, 246)';

// Mount render, then one render per theme change.
const EXPECTED_RENDERS = 3;

test('the last requested theme wins when two changes land in quick succession', async ({ page }) => {
  await page.goto('/test/fixtures/concurrent.html');
  await page.waitForFunction(() => (window as any).ready === true);
  expect(await page.locator('#d1').textContent()).toBe(LIGHT_LINE);

  // Two changes far enough apart for both to be seen as changes, close
  // enough that the second lands while the first render is still going.
  await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.documentElement.setAttribute('data-theme', 'light');
  });

  await expect
    .poll(() => page.evaluate(() => (window as any).runs.length))
    .toBe(EXPECTED_RENDERS);

  // Long enough for the slow first render to have landed on top, if renders
  // are allowed to overlap.
  await page.waitForTimeout(200);

  expect(await page.locator('#d1').textContent()).toBe(LIGHT_LINE);
  expect(await page.evaluate(() => (window as any).runs)).toEqual([
    LIGHT_LINE, DARK_LINE, LIGHT_LINE,
  ]);
});
