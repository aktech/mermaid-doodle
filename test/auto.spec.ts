import { expect, test } from '@playwright/test';

test('the IIFE build self-mounts against a global mermaid', async ({ page }) => {
  await page.goto('/test/fixtures/auto.html');
  await expect(page.locator('#d1 svg')).toBeVisible();
  await expect(page.locator('.doodle-source__pre')).toContainText('graph LR');
});

test('the self-mounted renderer still follows theme changes', async ({ page }) => {
  await page.goto('/test/fixtures/auto.html');
  await expect(page.locator('#d1 svg')).toBeVisible();
  const before = await page.locator('#d1 svg').innerHTML();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect.poll(() => page.locator('#d1 svg').innerHTML()).not.toBe(before);
});
