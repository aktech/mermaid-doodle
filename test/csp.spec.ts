import { expect, test } from '@playwright/test';

/**
 * The CDN fallback needs the Function constructor to keep the specifier
 * opaque to bundlers. Building that helper while the module is still
 * evaluating means the whole package fails to load under any policy without
 * 'unsafe-eval', including for a consumer who supplies mermaid directly and
 * has refused the CDN, so nothing renders at all.
 */
test('renders under a script-src with no unsafe-eval', async ({ page }) => {
  await page.goto('/test/fixtures/csp.html');
  await page.waitForFunction(() => (window as any).ready === true);
  await expect(page.locator('#d1')).toHaveText('RENDERED');
});
