import { expect, test } from '@playwright/test';

/** WCAG contrast between the panel's own background and its text. */
const panelContrast = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const channels = (value: string) =>
      (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const linear = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };
    const panel = document.querySelector('.doodle-source')!;
    const pre = document.querySelector('.doodle-source__pre')!;
    const back = luminance(channels(getComputedStyle(panel).backgroundColor));
    const front = luminance(channels(getComputedStyle(pre).color));
    const [high, low] = back > front ? [back, front] : [front, back];
    return (high + 0.05) / (low + 0.05);
  });

const styleOf = (page: import('@playwright/test').Page, selector: string, property: string) =>
  page.evaluate(
    ([sel, prop]) =>
      getComputedStyle(document.querySelector(sel!)!).getPropertyValue(prop!),
    [selector, property],
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixtures/source-panel-theme.html');
  await page.waitForFunction(() => (window as any).ready === true);
});

test('the source panel is readable on a dark page', async ({ page }) => {
  // The panel paints its own near-white background but set no colour, so the
  // text came from the page: on a dark site that is light text on a light
  // panel, which is invisible.
  expect(await panelContrast(page)).toBeGreaterThan(4.5);
});

test('a consumer can retheme the panel through the --doodle-source-* variables', async ({ page }) => {
  await page.evaluate(() => {
    const root = document.documentElement.style;
    root.setProperty('--doodle-source-bg', 'rgb(20, 20, 24)');
    root.setProperty('--doodle-source-text', 'rgb(240, 240, 245)');
    root.setProperty('--doodle-source-border', 'rgb(60, 60, 70)');
  });

  expect(await styleOf(page, '.doodle-source', 'background-color')).toBe('rgb(20, 20, 24)');
  expect(await styleOf(page, '.doodle-source__pre', 'color')).toBe('rgb(240, 240, 245)');
  expect(await styleOf(page, '.doodle-source', 'border-top-color')).toBe('rgb(60, 60, 70)');
  expect(await panelContrast(page)).toBeGreaterThan(4.5);
});
