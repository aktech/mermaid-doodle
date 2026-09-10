import { expect, test } from '@playwright/test';

// No renderer ever mounts in this fixture (see test/fixtures/anti-flash.html):
// these assertions pin what the stylesheet alone does, with zero JavaScript
// having run, which is the whole point of the zero-flash guarantee for the
// self-declaring shapes.

test('a pre.mermaid container is hidden by CSS alone before any renderer runs', async ({ page }) => {
  await page.goto('/test/fixtures/anti-flash.html');
  await expect(page.locator('#declared')).toBeHidden();
});

test('a [data-language="mermaid"] container stays visible before any renderer runs, since CSS cannot tell a diagram-to-be from a plain code sample', async ({ page }) => {
  await page.goto('/test/fixtures/anti-flash.html');
  await expect(page.locator('#ambiguous')).toBeVisible();
});
