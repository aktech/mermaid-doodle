import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixtures/theme.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('reads the theme from the data-theme attribute', async ({ page }) => {
  expect(await page.evaluate(() => (window as any).doodle.currentTheme())).toBe('light');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await page.evaluate(() => (window as any).doodle.currentTheme())).toBe('dark');
});

test('falls back to a dark class on the root element', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.add('dark');
  });
  expect(await page.evaluate(() => (window as any).doodle.currentTheme())).toBe('dark');
});

test('notifies watchers once per actual change', async ({ page }) => {
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect
    .poll(() => page.evaluate(() => (window as any).themeEvents))
    .toEqual(['dark', 'light']);
});

test('unsubscribing stops notifications', async ({ page }) => {
  await page.evaluate(() => (window as any).stopWatching());
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).themeEvents)).toEqual([]);
});
