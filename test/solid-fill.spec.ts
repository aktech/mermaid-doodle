import { expect, test } from '@playwright/test';

/**
 * Share of pixels inside a node's box, away from its border and label, that
 * are painted (close to) the given colour.
 */
async function fillCoverage(page: import('@playwright/test').Page, nodeId: string, rgb: [number, number, number]) {
  // The outline is the node's last path; its rect is the visible box.
  const box = await page.evaluate((id) => {
    const outline = document.querySelector(`#d1 svg [id$="flowchart-${id}-0"] path:last-of-type`);
    if (!outline) throw new Error(`node ${id} not found`);
    const { x, y, width, height } = outline.getBoundingClientRect();
    return { x, y, width, height };
  }, nodeId);
  // A band down the left of the box: inside the border, clear of the label.
  const clip = { x: box.x + 6, y: box.y + 6, width: 10, height: box.height - 12 };
  const png = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(
    async ({ png, rgb }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, img.width, img.height);
      let match = 0;
      for (let i = 0; i < data.length; i += 4) {
        const d = Math.abs(data[i] - rgb[0]) + Math.abs(data[i + 1] - rgb[1]) + Math.abs(data[i + 2] - rgb[2]);
        if (d < 40) match++;
      }
      return match / (data.length / 4);
    },
    { png, rgb },
  );
}

async function open(page: import('@playwright/test').Page, query = '') {
  await page.goto(`/test/fixtures/solid-fill.html${query}`);
  await page.waitForFunction(() => (window as any).ready === true);
}

test('paints a styled node fill solid, so light label text stays readable on it', async ({ page }) => {
  await open(page);
  expect(await fillCoverage(page, 'A', [0x05, 0x96, 0x69])).toBeGreaterThan(0.95);
});

test('solidFill: false keeps mermaid\'s hatched fill', async ({ page }) => {
  await open(page, '?hachure');
  expect(await fillCoverage(page, 'A', [0x05, 0x96, 0x69])).toBeLessThan(0.9);
});
