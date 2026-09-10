import { expect, test } from '@playwright/test';

/**
 * Mounting on a page that has no diagram must cost nothing. Resolving mermaid
 * before looking for work pulls roughly 3 MB off a CDN on every page of a
 * site that only has diagrams on a handful of them, which is what pushes
 * consumers into hand-writing their own presence gates (and getting the
 * selector list wrong).
 */
test('fetches no mermaid on a page with no diagram', async ({ page }) => {
  const cdnRequests: string[] = [];
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('https://cdn.jsdelivr.net/')) {
      cdnRequests.push(url);
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto('/test/fixtures/no-diagrams.html');
  await page.waitForFunction(() => (window as any).ready === true);

  expect(cdnRequests).toEqual([]);
});
