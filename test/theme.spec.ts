import { expect, test } from '@playwright/test';

const themeOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).doodle.currentTheme());

const eventsOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).themeEvents);

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
  expect(await eventsOf(page)).toEqual([]);
});

test('the operating system preference decides when the root says nothing', async ({ page }) => {
  // The attribute the page sets outranks the OS preference.
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await themeOf(page)).toBe('light');

  // With nothing on the root, the OS preference is all that is left.
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  expect(await themeOf(page)).toBe('dark');

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await themeOf(page)).toBe('light');
});

test('an operating system theme change notifies watchers, and unsubscribing stops that too', async ({ page }) => {
  // Nothing on the root, so the watcher has only the media query to go on.
  // This is the half of the unsubscribe path that removes the media query
  // listener, which no attribute-driven test can reach.
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => eventsOf(page)).toEqual(['dark']);

  await page.evaluate(() => (window as any).stopWatching());
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(100);
  expect(await eventsOf(page)).toEqual(['dark']);
});
