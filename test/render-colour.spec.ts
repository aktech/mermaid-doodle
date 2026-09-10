import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixtures/render-oklch.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('renders a diagram themed with oklch() custom properties', async ({ page }) => {
  await expect(page.locator('#d1 svg')).toBeVisible();
});

test('resolves oklch() to a colour mermaid actually drew, not the literal token', async ({ page }) => {
  const values = await page.evaluate(() => {
    const svg = document.querySelector('#d1 svg');
    if (!svg) return [];
    return Array.from(svg.querySelectorAll('[stroke], [fill]')).flatMap((el) => [
      el.getAttribute('stroke'),
      el.getAttribute('fill'),
    ]);
  });
  const nonNone = values.filter((v): v is string => !!v && v !== 'none');
  expect(nonNone.length).toBeGreaterThan(0);
  for (const v of nonNone) {
    expect(v.toLowerCase()).not.toContain('oklch');
  }
});
