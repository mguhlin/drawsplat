import { test, expect } from '@playwright/test';

test('imports a real twenty-minute video over 512 MB and restores it after reload', async ({ page }) => {
  test.skip(!process.env.VIDEOSPLAT_LARGE_FIXTURE, 'Provide a >512 MB, twenty-minute video fixture');
  test.setTimeout(180000);
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.getByRole('textbox', { name: 'Project name' }).fill('Large recording regression');
  await page.locator('input[type="file"][accept*="video/"]').first().setInputFiles(process.env.VIDEOSPLAT_LARGE_FIXTURE!);
  await expect(page.locator('.timeline-clip.video')).toHaveCount(1, { timeout: 120000 });
  expect(Number(await page.getByLabel('Clip duration', { exact: true }).inputValue())).toBeGreaterThanOrEqual(1200);
  await expect(page.getByText('Autosaved locally', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Open project…' }).click();
  await page.getByRole('button', { name: /Large recording regression.*1 media/ }).click();
  await expect(page.locator('.timeline-clip.video')).toHaveCount(1, { timeout: 30000 });
});
