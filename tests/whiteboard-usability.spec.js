const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('drawsplat.welcomed', '1');
    localStorage.setItem('drawsplat.consent.v1', 'accepted');
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
