import { expect, test } from '@playwright/test';

const strokeOf = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const edge = document.querySelector('#d1 svg .flowchart-link, #d1 svg path');
    return edge ? getComputedStyle(edge).stroke : null;
  });

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixtures/render.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('renders the diagram as inline SVG', async ({ page }) => {
  await expect(page.locator('#d1 svg')).toBeVisible();
  await expect(page.locator('#d1 svg')).toContainText('start');
});

test('renders the source panel when the wrapper opts in', async ({ page }) => {
  await expect(page.locator('.doodle-source')).toHaveCount(1);
  await expect(page.locator('.doodle-source__pre')).toContainText('graph LR');
});

test('re-renders with the new palette when the theme changes', async ({ page }) => {
  const light = await strokeOf(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect.poll(() => strokeOf(page)).not.toBe(light);
  await expect(page.locator('#d1 svg')).toHaveCount(1);
});

test('does not duplicate the source panel across re-renders', async ({ page }) => {
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect.poll(() => page.locator('.doodle-source').count()).toBe(1);
});

test('destroy stops the theme watcher', async ({ page }) => {
  await page.evaluate(() => (window as any).renderer.destroy());
  const before = await page.locator('#d1 svg').innerHTML();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(200);
  expect(await page.locator('#d1 svg').innerHTML()).toBe(before);
});
