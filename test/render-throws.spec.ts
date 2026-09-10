import { expect, test } from '@playwright/test';

const LIGHT_LINE = 'rgb(91, 60, 196)';

test('warns, and keeps working, when a render fails', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('[mermaid-doodle]')) warnings.push(message.text());
  });

  await page.goto('/test/fixtures/render-throws.html');
  await page.waitForFunction(() => (window as any).ready === true);

  // The render this triggers throws. Nothing is awaiting it, so without a
  // deliberate report the failure is completely silent.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect.poll(() => warnings.length).toBe(1);
  expect(warnings[0]).toContain('render blew up');

  // A failed render must not wedge the renderer for every later one.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect.poll(() => page.locator('#d1').textContent()).toBe(LIGHT_LINE);
});
