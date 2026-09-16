const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('drawsplat.welcomed', '1');
    localStorage.setItem('drawsplat.consent.accepted', '1');
  });
  await page.goto('/app/whiteboard.html');
});

test('keeps tool guidance visible and exposes selection state', async ({ page }) => {
  const hud = page.locator('#canvasToolHud');
  await expect(hud).toBeVisible();
  await expect(page.locator('[data-tool="select"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#drawToolGroup > summary').click();
  await page.locator('[data-tool="pen"]').click();
  await expect(page.locator('#canvasToolName')).toHaveText('Pencil');
  await expect(page.locator('#canvasToolHelp')).toContainText('drag on the canvas');
  await expect(page.locator('#toolButtons [data-tool="pen"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-tool="select"]')).toHaveAttribute('aria-pressed', 'false');
});

test('provides keyboard navigation landmarks', async ({ page }) => {
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#boardSvg');
  await expect(page.locator('.sidebar')).toHaveAttribute('aria-label', 'Whiteboard tools');
  await expect(page.locator('.stage-wrap')).toHaveAttribute('aria-label', 'Whiteboard workspace');
  await expect(page.locator('#boardSvg')).toHaveAttribute('tabindex', '0');
});

for (const width of [1280, 390]) {
  test(`insert tools have visible explanations and remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#insertToolGroup > summary').click();
    const menu = page.locator('#insertToolGroup .tool-popover-panel');
    await expect(menu).toBeVisible();
    await expect(menu.locator('.insert-tool-description')).toHaveCount(14);
    await expect(page.locator('#simpleMosaicBtn')).toContainText('even grid');
    await expect(page.locator('#simpleCollageBtn')).toContainText('text banner');
    const bounds = await menu.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    const emoji = page.locator('#simpleEmojiBtn');
    await emoji.scrollIntoViewIfNeeded();
    await expect(emoji.locator('.icon-label')).toBeVisible();
    // Hit testing catches menus clipped by the scrolling rail or covered by the canvas.
    expect(await emoji.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await expect(emoji.locator('svg')).toBeVisible();
    await page.locator('#simpleWheelSpinnerBtn').click();
    await expect(menu).toBeHidden();
    await expect(page.locator('#boardSvg')).toContainText('Wheel Spinner');
  });
}
