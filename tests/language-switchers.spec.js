const { test, expect } = require('@playwright/test');

const apps = [
  { path:'/solutions/pdfsplat/', spanish:'Abrir archivo' },
  { path:'/solutions/mediasplat/', spanish:'Corta y combina archivos multimedia sin subirlos.' },
  { path:'/solutions/videosplat/', spanish:'Edición privada de video. Directamente en tu navegador.' },
];

test('PDFsplat, MediaSplat, and VideoSplat expose persistent language controls', async ({ page }) => {
  for (const app of apps) {
    await page.goto(app.path);
    if(app.path.includes('pdfsplat'))await page.locator('.pdf-toolbar-menu').filter({has:page.locator('[data-pdf-language]')}).locator('summary').click();
    const switcher = page.locator('.ds-language-control select');
    await expect(switcher).toBeVisible();
    await expect(switcher.locator('option')).toHaveCount(6);
    await switcher.selectOption('es');
    await expect(page.locator('body')).toContainText(app.spanish);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  }
  await page.goto(apps[0].path);
  await expect(page.locator('.ds-language-control select')).toHaveValue('es');
});

test('Arabic applies translated labels and RTL direction, and English restores the UI', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('.pdf-toolbar-menu').filter({has:page.locator('[data-pdf-language]')}).locator('summary').click();
  const switcher = page.locator('.ds-language-control select');
  await switcher.selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name:'فتح ملف' })).toBeVisible();
  await switcher.selectOption('en');
  await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name:'Open file',exact:true })).toBeVisible();
});
