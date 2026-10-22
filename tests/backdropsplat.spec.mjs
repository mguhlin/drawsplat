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
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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

async function backgroundFile(page, width = 140, height = 70) {
  const data = await page.evaluate(({width, height}) => {
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const x = c.getContext('2d'); x.fillStyle = '#ff0000'; x.fillRect(0, 0, width / 2, height);
    x.fillStyle = '#0000ff'; x.fillRect(width / 2, 0, width / 2, height);
    return c.toDataURL().split(',')[1];
  }, {width, height});
  return { name: 'replacement.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
async function chooseReplacement(page, file) {
  await page.locator('#backgroundFile').setInputFiles(file);
  await expect(page.locator('#backgroundStatus')).toContainText('selected');
  await expect(page.locator('#download')).toBeEnabled();
}

test('uploaded replacement is painted behind the subject in preview, PNG, JPEG, and ZIP without reprocessing', async ({page}) => {
  await page.locator('#mode').selectOption('white'); const file = await logo(page); await upload(page, [file, file]);
  await page.locator('#processAll').click(); await expect(page.locator('#status')).toContainText('2 images ready');
  let workers = 0; page.on('worker', () => workers++);
  await chooseReplacement(page, await backgroundFile(page));
  await expect(page.locator('#background')).toHaveValue('image'); await expect(page.locator('#reveal')).toHaveValue('0');
  let png = await save(page);
  expect((await inspect(page, png, 1, 1)).pixel).toEqual([255, 0, 0, 255]);
  expect((await inspect(page, png, 69, 1)).pixel).toEqual([0, 0, 255, 255]);
  expect((await inspect(page, png, 20, 20)).pixel).toEqual([0, 0, 0, 255]);
  const preview = await page.locator('#resultImage').evaluate(async img => {
    await img.decode(); const c = document.createElement('canvas');c.width = img.naturalWidth;c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);return [...c.getContext('2d').getImageData(1, 1, 1, 1).data];
  }); expect(preview).toEqual([255, 0, 0, 255]);
  await page.locator('#format').selectOption('jpeg');const jpg = await inspect(page, await save(page), 1, 1);
  expect(jpg.pixel[0]).toBeGreaterThan(245);expect(jpg.pixel[2]).toBeLessThan(10);expect(jpg.pixel[3]).toBe(255);
  await page.locator('#format').selectOption('png');const zip = await save(page, '#downloadAll');
  const entries = await page.evaluate(async bytes => {
    const z = await window.JSZip.loadAsync(new Uint8Array(bytes));const out = [];
    for (const [name, file] of Object.entries(z.files)) out.push({name, bytes:[...await file.async('uint8array')]});return out;
  }, [...zip]);
  expect(entries.map(e=>e.name)).toEqual(['logo-cutout.png','logo-cutout-2.png']);
  for (const entry of entries) expect((await inspect(page, entry.bytes, 69, 1)).pixel).toEqual([0,0,255,255]);
  await page.locator('#background').selectOption('transparent');png = await save(page);expect((await inspect(page, png)).pixel[3]).toBe(0);
  await page.locator('#background').selectOption('image');await page.locator('#backgroundFit').selectOption('contain');
  png = await save(page);expect((await inspect(page,png)).pixel).toEqual([255,255,255,255]);expect((await inspect(page,png,1,35)).pixel).toEqual([255,0,0,255]);
  await page.locator('#removeBackgroundImage').click();await expect(page.locator('#background')).toHaveValue('transparent');expect((await inspect(page,await save(page))).pixel[3]).toBe(0);
  expect(workers).toBe(0);
});

test('six built-in scenes work with connections off, survive output changes, and clear with the foreground list', async ({page}) => {
  await page.locator('#sample').click();await expect(page.locator('#download')).toBeEnabled();
  await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
  await expect(page.locator('.background-choice')).toHaveCount(6);
  for (const name of ['Studio Paper','Soft Lavender','Classroom Board','Splat Confetti','Mountain Morning','Coastal Calm']) {
    const button = page.getByRole('button',{name,exact:true});await button.click();
    await expect(button).toHaveAttribute('aria-pressed','true');await expect(page.locator('#download')).toBeEnabled();
    const result = await inspect(page,await save(page));expect(result.width).toBe(800);expect(result.height).toBe(500);expect(result.pixel[3]).toBe(255);
  }
  await page.locator('#background').selectOption('transparent');await expect(page.getByRole('button',{name:'Coastal Calm',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.locator('#background').selectOption('image');await expect(page.getByRole('button',{name:'Coastal Calm',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#backgroundSection').scrollIntoViewIfNeeded();await page.screenshot({path:'.tmp/backdropsplat/replacement-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.tmp/backdropsplat/replacement-desktop.png',fullPage:true});
  await page.locator('#clear').click();await expect(page.locator('#backgroundThumbnail')).toBeHidden();await expect(page.locator('#background')).toHaveValue('transparent');await expect(page.locator('#queue li')).toHaveCount(0);
});

test('online image URL is fetched without credentials or referrer and used in the exported composite', async ({page}) => {
  await page.locator('#sample').click();await expect(page.locator('#download')).toBeEnabled();const file = await backgroundFile(page);
  let request;await page.route('https://backgrounds.example/scene.png',async route=>{request=route.request();await route.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:file.buffer});});
  await page.locator('#backgroundURL').fill('https://backgrounds.example/scene.png');await page.locator('#loadBackgroundURL').click();
  await expect(page.locator('#backgroundStatus')).toContainText('Online image · backgrounds.example selected');
  expect(request.method()).toBe('GET');expect(request.postData()).toBeNull();expect(request.headers()['referer']).toBeUndefined();expect(request.headers()['cookie']).toBeUndefined();
  expect((await inspect(page,await save(page),1,1)).pixel).toEqual([255,0,0,255]);
  await page.locator('#backgroundURL').fill('http://backgrounds.example/scene.png');await page.locator('#loadBackgroundURL').click();await expect(page.locator('#backgroundStatus')).toContainText('HTTPS');
  await page.route('https://backgrounds.example/blocked.png',r=>r.abort('accessdenied'));
  await page.locator('#backgroundURL').fill('https://backgrounds.example/blocked.png');await page.locator('#loadBackgroundURL').click();await expect(page.locator('#backgroundStatus')).toContainText('upload it here instead');
  expect((await inspect(page,await save(page),1,1)).pixel).toEqual([255,0,0,255]);
});

test('online loading honors privacy changes and cancel, while local uploads remain available', async ({page}) => {
  await page.locator('#sample').click();await expect(page.locator('#download')).toBeEnabled();
  await page.getByRole('button',{name:'Classroom Board',exact:true}).click();await expect(page.locator('#backgroundStatus')).toContainText('selected');
  await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
  const external=[];page.on('request',r=>{if(r.url().startsWith('https://backgrounds.example'))external.push(r.url());});
  await page.locator('#backgroundURL').fill('https://backgrounds.example/held.png');await page.locator('#loadBackgroundURL').click();await expect(page.locator('#backgroundStatus')).toContainText('Optional connections are off');expect(external).toEqual([]);
  await chooseReplacement(page,await backgroundFile(page));
  await page.evaluate(()=>window.SplatPrivacy.setConnections(true));let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('https://backgrounds.example/held.png',async route=>{await gate;await route.abort().catch(()=>{});});
  for(const revoke of [false,true]) {
    const pending=page.waitForRequest(r=>r.url().startsWith('https://backgrounds.example'));
    await page.locator('#loadBackgroundURL').click();await pending;
    await expect(page.locator('#download')).toBeDisabled();
    if(revoke) await page.evaluate(()=>window.SplatPrivacy.setConnections(false));else await page.locator('#cancelBackground').click();
    await expect(page.locator('#backgroundStatus')).toContainText(revoke?'optional connections are off':'cancelled');
    await expect(page.locator('#download')).toBeEnabled();expect((await inspect(page,await save(page),1,1)).pixel).toEqual([255,0,0,255]);
  }
  release();
});

test('bad, oversized and non-image backgrounds preserve the prior scene with a useful error', async ({page}) => {
  await page.locator('#sample').click();await expect(page.locator('#download')).toBeEnabled();
  await page.getByRole('button',{name:'Soft Lavender',exact:true}).click();await expect(page.locator('#backgroundStatus')).toContainText('selected');
  await page.locator('#backgroundFile').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('broken')});await expect(page.locator('#backgroundStatus')).toContainText('cannot open');
  await page.route('https://backgrounds.example/huge.png',r=>r.fulfill({headers:{'access-control-allow-origin':'*','content-length':'42000000'},body:'x',contentType:'image/png'}));
  await page.locator('#backgroundURL').fill('https://backgrounds.example/huge.png');await page.locator('#loadBackgroundURL').click();await expect(page.locator('#backgroundStatus')).toContainText('over 40 MB');
  await page.route('https://backgrounds.example/page',r=>r.fulfill({headers:{'access-control-allow-origin':'*'},body:'<html>not an image</html>',contentType:'text/html'}));
  await page.locator('#backgroundURL').fill('https://backgrounds.example/page');await page.locator('#loadBackgroundURL').click();await expect(page.locator('#backgroundStatus')).toContainText('direct image link');
  await expect(page.getByRole('button',{name:'Soft Lavender',exact:true})).toHaveAttribute('aria-pressed','true');expect((await inspect(page,await save(page))).pixel[3]).toBe(255);
});

test('a background can be chosen first and uploaded PNG backgrounds retain their own transparency', async ({page}) => {
  await page.getByRole('button',{name:'Studio Paper',exact:true}).click();await expect(page.locator('#backgroundStatus')).toContainText('Remove the original background');
  await page.locator('#mode').selectOption('white');await upload(page,await logo(page));await runCutout(page);
  expect((await inspect(page,await save(page))).pixel[3]).toBe(255);
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=70;c.getContext('2d').fillStyle='#00ff00';c.getContext('2d').fillRect(60,0,10,70);return c.toDataURL().split(',')[1];});
  await chooseReplacement(page,{name:'transparent-backdrop.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
  const png=await save(page);expect((await inspect(page,png)).pixel[3]).toBe(0);expect((await inspect(page,png,20,20)).pixel).toEqual([0,0,0,255]);expect((await inspect(page,png,65,1)).pixel).toEqual([0,255,0,255]);
  await page.locator('#format').selectOption('jpeg');const jpg=await inspect(page,await save(page));expect(jpg.pixel[3]).toBe(255);expect(jpg.pixel[0]).toBeGreaterThan(245);
});
