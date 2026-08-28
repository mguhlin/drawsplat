const { test, expect } = require('@playwright/test');

test('QRSplat creates styled standard QR codes and saves designs locally', async ({ page }) => {
  await page.goto('/solutions/qrsplat/');
  await expect(page.locator('#qrPreview svg')).toBeVisible();
  await expect(page.locator('#payloadPreview')).toHaveText('https://drawsplat.org/');

  await page.locator('#qrContent').fill('https://example.org/classroom');
  await page.locator('#template').selectOption('drawsplat');
  await expect(page.locator('#darkColor')).toHaveValue('#6d38e8');
  await expect(page.locator('#errorLevel')).toHaveValue('H');
  await expect(page.locator('#qrPreview svg image')).toHaveCount(1);
  await expect(page.locator('#qrPreview svg image')).toHaveAttribute('href', /data:image\/png;base64,/);
  await expect(page.locator('#payloadPreview')).toHaveText('https://example.org/classroom');

  await page.locator('#designName').fill('Classroom link');
  await page.getByRole('button', { name:'Save design locally' }).click();
  await expect(page.locator('#savedDesigns')).toContainText('Classroom link');
  await page.reload();
  await expect(page.locator('#savedDesigns')).toContainText('Classroom link');
});

test('QRSplat adds and cartoon-stylizes a custom center image locally', async ({ page }) => {
  await page.goto('/solutions/qrsplat/');
  await page.locator('#centerImage').setInputFiles('assets/brand/DrawSplat_logo_transparent.png');
  await expect(page.locator('#centerImageControls')).toBeVisible();
  await expect(page.locator('#errorLevel')).toHaveValue('H');
  await expect(page.locator('#qrPreview svg image')).toHaveCount(1);
  const original = await page.locator('#qrPreview svg image').getAttribute('href');

  await page.locator('#cartoonEffect').check();
  await expect(page.locator('#centerImageHelp')).toContainText('Cartoon effect applied locally');
  const cartoon = await page.locator('#qrPreview svg image').getAttribute('href');
  expect(cartoon).not.toBe(original);

  await page.locator('#centerImageSize').fill('22');
  await expect(page.locator('#centerImageSizeOutput')).toHaveText('22% of QR width');
  await page.getByRole('button', { name:'Remove center image' }).click();
  await expect(page.locator('#qrPreview svg image')).toHaveCount(0);
});

test('Reset clears the current QR without deleting saved designs', async ({ page }) => {
  await page.goto('/solutions/qrsplat/');
  await page.locator('#qrContent').fill('https://example.org/finished');
  await page.locator('#designName').fill('Keep this saved design');
  await page.locator('#saveDesign').click();
  await page.locator('#template').selectOption('drawsplat');
  await page.locator('#centerImage').setInputFiles('assets/brand/DrawSplat_logo_transparent.png');
  await page.locator('#centerImageSize').fill('22');

  await page.getByRole('button', { name:'Reset' }).click();

  await expect(page.locator('[data-mode="standard"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#contentType')).toHaveValue('url');
  await expect(page.locator('#qrContent')).toHaveValue('');
  await expect(page.locator('#payloadPreview')).toHaveText('Nothing yet');
  await expect(page.locator('#qrPreview svg')).toHaveCount(0);
  await expect(page.locator('#template')).toHaveValue('classic');
  await expect(page.locator('#errorLevel')).toHaveValue('M');
  await expect(page.locator('#centerImageSize')).toHaveValue('18');
  await expect(page.locator('#centerImageControls')).toBeHidden();
  await expect(page.locator('#designName')).toHaveValue('My QR code');
  await expect(page.locator('#savedDesigns')).toContainText('Keep this saved design');
});

test('QRSplat generates Wi-Fi payloads and downloads SVG and PNG files', async ({ page }) => {
  await page.goto('/solutions/qrsplat/');
  await page.locator('#contentType').selectOption('wifi');
  await page.locator('#wifiName').fill('Library;Guest');
  await page.locator('#wifiPassword').fill('read:more');
  await page.locator('#saveDesign').click();
  const savedDesigns = await page.evaluate(() => localStorage.getItem('qrsplat.designs.v1'));
  expect(savedDesigns).not.toContain('read:more');
  await expect(page.locator('#payloadPreview')).toHaveText('WIFI:T:WPA;S:Library\\;Guest;P:read\\:more;H:false;');

  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Download SVG' }).click();
  await expect((await svgDownload).suggestedFilename()).toBe('my-qr-code.svg');

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Download PNG' }).click();
  await expect((await pngDownload).suggestedFilename()).toBe('my-qr-code.png');
});

test('editable QR mode is gated until an administrator configures a service', async ({ page }) => {
  await page.route('https://script.google.com/macros/s/example/exec', async route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ ok:true, code:'AbC2345' }) }));
  await page.goto('/solutions/qrsplat/');
  await page.getByRole('button', { name:'Editable QR' }).click();
  await expect(page.locator('#editableRun')).toBeDisabled();
  await page.getByRole('button', { name:'Configure editable QR service' }).click();
  await page.locator('#backendUrl').fill('https://script.google.com/macros/s/example/exec');
  await page.locator('#redirectBase').fill('https://script.google.com/macros/s/example/exec?code=');
  await page.locator('#adminKey').fill('test-only-admin-key');
  await page.getByRole('button', { name:'Save configuration' }).click();
  await expect(page.locator('#editableRun')).toBeEnabled();
  await page.locator('#editableDestination').fill('https://example.org/new-resource');
  await page.locator('#editableRun').click();
  await expect(page.locator('#editableStatus')).toContainText('AbC2345');
  await expect(page.locator('#payloadPreview')).toHaveText('https://script.google.com/macros/s/example/exec?code=AbC2345');
});

test('QRSplat is discoverable by natural-language aliases', async ({ page }) => {
  await page.goto('/studio/?q=qr%20code%20maker');
  await expect(page.locator('.ds-tool-card h3').first()).toHaveText('QRSplat Studio');
});
