import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/test/fixtures/source-view.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('renders a labelled panel with highlighted source', async ({ page }) => {
  await expect(page.locator('.doodle-source__lang')).toHaveText('mermaid');
  await expect(page.locator('.doodle-source__pre .doodle-hl-k').first()).toHaveText('graph');
  await expect(page.locator('.doodle-source__pre')).toContainText('graph LR');
});

test('copies the original source, not the highlighted markup', async ({ page }) => {
  await page.locator('.doodle-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe('graph LR\n  A --> B');
});

test('marks the button copied and clears the mark', async ({ page }) => {
  await page.locator('.doodle-copy').click();
  await expect(page.locator('.doodle-copy')).toHaveClass(/is-copied/);
  await expect(page.locator('.doodle-copy')).not.toHaveClass(/is-copied/, { timeout: 4000 });
});
