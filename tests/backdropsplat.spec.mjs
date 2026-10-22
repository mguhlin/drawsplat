import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

async function logo(page) {
  const data = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 70; c.height = 70;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 70, 70);
    x.fillStyle = '#000'; x.fillRect(10, 10, 50, 50); x.fillStyle = '#fff'; x.fillRect(30, 30, 10, 10);
    return c.toDataURL().split(',')[1];
  });
  return { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
async function upload(page, files) { await page.locator('#files').setInputFiles(files); await expect(page.locator('#process')).toBeEnabled(); }
async function runCutout(page) { await page.locator('#process').click(); await expect(page.locator('#download')).toBeEnabled({ timeout: 20_000 }); }
async function save(page, id = '#download') {
  const pending = page.waitForEvent('download'); await page.locator(id).click();
  const download = await pending; return fs.readFile(await download.path());
}
async function inspect(page, buffer, x = 0, y = 0) {
  return page.evaluate(async ({ bytes, x, y }) => {
    const im = await createImageBitmap(new Blob([new Uint8Array(bytes)]));
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    c.getContext('2d').drawImage(im, 0, 0); im.close();
    return { width: c.width, height: c.height, pixel: [...c.getContext('2d').getImageData(x, y, 1, 1).data] };
  }, { bytes: [...buffer], x, y });
}

test.beforeEach(async ({ page }) => { await page.goto('/solutions/backdropsplat/'); });

test('white removal exports full-size PNG and preserves enclosed white only in edges mode', async ({ page }) => {
  const external = []; page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:8792')) external.push(r.url()); });
  await page.locator('#mode').selectOption('white'); await upload(page, await logo(page)); await runCutout(page);
  let png = await save(page);
  expect(await inspect(page, png)).toEqual({ width: 70, height: 70, pixel: [0, 0, 0, 0] });
  expect((await inspect(page, png, 35, 35)).pixel[3]).toBe(255);
  await page.locator('#scope').selectOption('all'); await expect(page.locator('#download')).toBeDisabled();
  await runCutout(page); png = await save(page);
  expect((await inspect(page, png, 35, 35)).pixel[3]).toBe(0);
  expect(external).toEqual([]);
});
test('solid PNG, transparent-to-JPEG flattening, and comparison work', async ({ page }) => {
  await page.locator('#sample').click(); await expect(page.locator('#download')).toBeEnabled();
  await page.locator('#showResult').click(); await expect(page.locator('#reveal')).toHaveValue('0');
  await page.locator('#reveal').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#reveal')).toHaveValue('1');
  await page.locator('#background').selectOption('color');
  await page.locator('#backgroundColor').fill('#00ff00'); await page.locator('#backgroundColor').dispatchEvent('input');
  let result = await inspect(page, await save(page)); expect(result.pixel).toEqual([0, 255, 0, 255]);
  await page.locator('#background').selectOption('transparent'); await page.locator('#format').selectOption('jpeg');
  await expect(page.locator('#formatHint')).toContainText('uses white');
  result = await inspect(page, await save(page)); expect(result.width).toBe(800); expect(result.height).toBe(500);
  expect(result.pixel[3]).toBe(255); expect(result.pixel[0]).toBeGreaterThan(245);
});
test('batch ZIP includes distinct names and clearing releases the working list', async ({ page }) => {
  await page.locator('#mode').selectOption('white'); const file = await logo(page); await upload(page, [file, file]);
  await page.locator('#processAll').click(); await expect(page.locator('#status')).toContainText('2 images ready');
  const zip = await save(page, '#downloadAll');
  const names = await page.evaluate(async bytes => Object.keys((await window.JSZip.loadAsync(new Uint8Array(bytes))).files), [...zip]);
  expect(names).toEqual(['logo-cutout.png', 'logo-cutout-2.png']);
  await page.locator('#clear').click(); await expect(page.locator('#queue li')).toHaveCount(0); await expect(page.locator('#download')).toBeDisabled();
});
test('privacy setting blocks all photo downloads but keeps white removal usable', async ({ page }) => {
  await upload(page, await logo(page));
  await page.evaluate(() => window.SplatPrivacy.setConnections(false));
  const remote = []; page.on('request', r => { if (/huggingface|hf\.co/.test(r.url())) remote.push(r.url()); });
  await page.locator('#process').click(); await expect(page.locator('#status')).toContainText('Optional connections are off');
  expect(remote).toEqual([]);
  await page.locator('#mode').selectOption('white'); await runCutout(page); expect(remote).toEqual([]);
});
test('cancel stops a pending photo download and allows local processing afterward', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('https://huggingface.co/**', async route => { await gate; await route.abort().catch(() => {}); });
  await upload(page, await logo(page));
  const downloading = page.waitForRequest(r => r.url().startsWith('https://huggingface.co/'));
  await page.locator('#process').click(); await downloading;
  await page.locator('#cancel').click(); release();
  await expect(page.locator('#status')).toContainText('cancelled'); await expect(page.locator('#download')).toBeDisabled();
  await page.locator('#mode').selectOption('white'); await runCutout(page);
});
test('bad files, mobile layout, and filenames are handled without injecting markup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mode').selectOption('white');
  await page.locator('#files').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('.file-state.error')).toContainText('cannot open');
  const file = await logo(page); file.name = '<script>bad</script>.png'; await upload(page, file); await runCutout(page);
  await expect(page.locator('.file-name').last()).toHaveText('<script>bad</script>.png');
  expect(await page.locator('#queue script').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.tmp/backdropsplat/mobile.png', fullPage: true });
});

test('keyboard skip, paste, and color removal work without photo downloads', async ({ page }) => {
  await page.keyboard.press('Tab'); await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#workspace')).toBeFocused();
  await page.locator('#mode').selectOption('color');
  const file = await logo(page);
  await page.evaluate(bytes => {
    const data = new DataTransfer(); data.items.add(new File([new Uint8Array(bytes)], 'pasted-logo.png', { type: 'image/png' }));
    // Firefox strips synthetic ClipboardEvent file payloads. Supply the same
    // read-only clipboard interface the native paste handler receives.
    const event = new Event('paste', { bubbles: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
    window.dispatchEvent(event);
  }, [...file.buffer]);
  await expect(page.locator('#process')).toBeEnabled();
  await page.locator('#keyColor').fill('#000000'); await page.locator('#keyColor').dispatchEvent('input');
  await page.locator('#scope').selectOption('all'); await runCutout(page);
  const png = await save(page);
  expect((await inspect(page, png, 20, 20)).pixel[3]).toBe(0);
  expect((await inspect(page, png)).pixel).toEqual([255, 255, 255, 255]);
});

test('the suite exposes the tool through its homepage and searchable alias', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="/solutions/backdropsplat/"]').first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { getById } = await import('/assets/js/tool-registry.js');
    const tool = await getById('backdropsplat'); return { name: tool.name, alias: tool.aliases.includes('DisappearBkgrndSplat') };
  });
  expect(result).toEqual({ name: 'BackdropSplat', alias: true });
});

test('real ORMBG inference produces an alpha cutout without uploading pixels', async ({ page }) => {
  test.skip(!process.env.BACKDROPSPLAT_REAL_AI, 'Run explicitly with the real model and a photo fixture.');
  test.setTimeout(240_000);
  const outbound = []; page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:8792')) outbound.push({ url: r.url(), method: r.method(), bytes: r.postDataBuffer()?.length || 0 }); });
  await page.locator('#model').selectOption(process.env.BACKDROPSPLAT_MODEL || 'fast');
  await upload(page, process.env.BACKDROPSPLAT_PHOTO || 'kitty.png');
  await page.locator('#process').click(); await expect(page.locator('#download')).toBeEnabled({ timeout: 220_000 });
  const png = await save(page);
  const alpha = await page.evaluate(async bytes => {
    const im = await createImageBitmap(new Blob([new Uint8Array(bytes)])); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im,0,0); im.close(); const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let transparent=0,opaque=0;for(let i=3;i<data.length;i+=4){if(data[i]<20)transparent++;if(data[i]>230)opaque++;}return {transparent,opaque,width:c.width,height:c.height};
  }, [...png]);
  expect(alpha.transparent).toBeGreaterThan(100); expect(alpha.opaque).toBeGreaterThan(100);
  expect(outbound.every(r=>r.method==='GET'&&r.bytes===0)).toBe(true);
  await page.screenshot({ path: '.tmp/backdropsplat/real-photo.png', fullPage: true });
  console.log('Real local photo inference:',alpha,'model requests:',outbound.length,'quality:',await page.locator('.file-state').textContent());
});
