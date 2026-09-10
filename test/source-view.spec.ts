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

test('does not enter the copied state and raises no unhandled rejection when the clipboard write is refused', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.evaluate(() => {
    (window as any).__rejections = [];
    window.addEventListener('unhandledrejection', (event) => {
      (window as any).__rejections.push(String(event.reason));
    });
    navigator.clipboard.writeText = () => Promise.reject(new Error('write denied'));
  });

  await page.locator('.doodle-copy').click();
  // Flush the page's microtask queue (where the click handler's promise
  // chain settles) before asserting nothing leaked out as unhandled.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(await page.evaluate(() => (window as any).__rejections)).toEqual([]);
  expect(pageErrors).toEqual([]);
  await expect(page.locator('.doodle-copy')).not.toHaveClass(/is-copied/);
});

test('does not throw and does not enter the copied state when the Clipboard API is unavailable', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  await page.locator('.doodle-copy').click();
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(pageErrors).toEqual([]);
  await expect(page.locator('.doodle-copy')).not.toHaveClass(/is-copied/);
});
