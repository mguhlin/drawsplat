import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
async function upload(page, count = 1, path) {
  if (path) await page.locator('#imageInput').setInputFiles(path);
  else {
    const data = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = c.height = 70;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 70, 70);
      x.fillStyle = '#000'; x.fillRect(10, 10, 50, 50); x.fillStyle = '#fff'; x.fillRect(30, 30, 10, 10);
      return c.toDataURL().split(',')[1];
    });
    await page.locator('#imageInput').setInputFiles(Array.from({length:count}, () => ({ name:'logo.png', mimeType:'image/png', buffer:Buffer.from(data,'base64') })));
  }
  await expect(page.locator('#layerList .layer')).toHaveCount(count);
}
async function open(page, action = 'smartRemoveBg') {
  await page.getByRole('button', {name:'Effects', exact:true}).click();
  await page.locator(`[data-action="${action}"]`).click();
  await expect(page.locator('#backgroundStudio')).toBeVisible();
}
async function cutout(page) { await page.locator('#bs-process').click(); await expect(page.locator('#bs-apply')).toBeEnabled({timeout:20000}); }
async function pixel(page, id = 'bs-original', x = 0, y = 0) { return page.locator('#' + id).evaluate((c, p) => [...c.getContext('2d').getImageData(p.x,p.y,1,1).data], {x,y}); }
async function save(page, id = 'bs-download') { const pending = page.waitForEvent('download'); await page.locator('#'+id).click(); return fs.readFile(await (await pending).path()); }
async function inspect(page, bytes, x = 0, y = 0) {
  return page.evaluate(async ({bytes,x,y}) => {
    const image = await createImageBitmap(new Blob([new Uint8Array(bytes)])), c = document.createElement('canvas'); c.width=image.width;c.height=image.height;
    c.getContext('2d').drawImage(image,0,0);image.close();return {width:c.width,height:c.height,pixel:[...c.getContext('2d').getImageData(x,y,1,1).data]};
  },{bytes:[...bytes],x,y});
}
async function selectImage(page) { await page.locator('#layerList .layer .name').click(); }
test.beforeEach(async ({page}) => { await page.goto('/solutions/imagesplat/'); });

test('white cutout previews, invalidates stale results, applies to the layer and survives Undo/Redo', async ({page}) => {
  const external=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8792'))external.push(r.url());});
  await upload(page);await open(page,'removeBg');await expect(page.locator('#bs-mode')).toHaveValue('white');
  await cutout(page);expect((await pixel(page,'bs-result'))[3]).toBe(0);expect((await pixel(page,'bs-result',35,35))[3]).toBe(255);
  expect(await inspect(page,await save(page))).toEqual({width:70,height:70,pixel:[0,0,0,0]});
  await page.locator('#bs-scope').selectOption('all');await expect(page.locator('#bs-apply')).toBeDisabled();await expect(page.locator('#bs-download')).toBeDisabled();
  await cutout(page);expect((await pixel(page,'bs-result',35,35))[3]).toBe(0);
  await page.locator('#bs-apply').click();await expect(page.locator('#backgroundStudio')).toHaveCount(0);
  await open(page);expect((await pixel(page))[3]).toBe(0);expect((await pixel(page,'bs-original',35,35))[3]).toBe(0);await page.keyboard.press('Escape');
  await page.locator('.toolbar [data-action="undo"]').click();await selectImage(page);await open(page);expect((await pixel(page))[3]).toBe(255);await page.keyboard.press('Escape');
  await page.locator('.toolbar [data-action="redo"]').click();await selectImage(page);await open(page);expect((await pixel(page))[3]).toBe(0);
  expect(external).toEqual([]);
});

test('color picker samples the original; Cancel preserves pixels and creates no extra Undo step', async ({page}) => {
  await upload(page);await open(page,'removeColor');await expect(page.locator('#bs-mode')).toHaveValue('color');
  const box=await page.locator('#bs-original').boundingBox();await page.locator('#bs-original').click({position:{x:box.width*.25,y:box.height*.25}});
  await expect(page.locator('#bs-color')).toHaveValue('#000000');await page.locator('#bs-scope').selectOption('all');await cutout(page);
  expect((await pixel(page,'bs-result',20,20))[3]).toBe(0);expect((await pixel(page,'bs-result'))[3]).toBe(255);
  await page.locator('#bs-cancel').click();await open(page);expect((await pixel(page,'bs-original',20,20))[3]).toBe(255);await page.keyboard.press('Escape');
  await page.locator('.toolbar [data-action="undo"]').click();await expect(page.locator('#layerList .layer')).toHaveCount(0);
});

test('two selected layers export unique ZIP names, apply together, and restore with one Undo', async ({page}) => {
  await upload(page,2);
  const stage=page.locator('#stage'),box=await stage.boundingBox();const native=await stage.evaluate(c=>({w:c.width,h:c.height}));
  await stage.click({position:{x:50*box.width/native.w,y:65*box.height/native.h}});
  await stage.click({position:{x:125*box.width/native.w,y:105*box.height/native.h},modifiers:['Shift']});
  await open(page,'removeBg');await expect(page.locator('#bs-layer option')).toHaveCount(2);await cutout(page);
  const zip=await save(page,'bs-zip');const names=await page.evaluate(async bytes=>Object.keys((await window.JSZip.loadAsync(new Uint8Array(bytes))).files),[...zip]);
  expect(names).toEqual(['logo-cutout.png','logo-cutout-2.png']);
  await page.locator('#bs-apply').click();await expect(page.locator('#backgroundStudio')).toHaveCount(0);
  for(let i=0;i<2;i++){await page.locator('#layerList .layer .name').nth(i).click();await open(page);expect((await pixel(page))[3]).toBe(0);await page.keyboard.press('Escape');}
  await page.locator('.toolbar [data-action="undo"]').click();
  for(let i=0;i<2;i++){await page.locator('#layerList .layer .name').nth(i).click();await open(page);expect((await pixel(page))[3]).toBe(255);await page.keyboard.press('Escape');}
});

test('privacy blocks photo downloads; cancellation terminates a held model request and white mode still works', async ({page}) => {
  await upload(page);await open(page);await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
  const remote=[];page.on('request',r=>{if(/huggingface|hf\.co|esm\.sh/.test(r.url()))remote.push(r.url());});
  await page.locator('#bs-process').click();await expect(page.locator('#bs-status')).toContainText('Optional connections are off');expect(remote).toEqual([]);
  await page.evaluate(()=>window.SplatPrivacy.setConnections(true));
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('https://huggingface.co/**',async route=>{await gate;await route.abort().catch(()=>{});});
  const downloading=page.waitForRequest(r=>r.url().startsWith('https://huggingface.co/'));
  await page.locator('#bs-process').click();await downloading;await page.locator('#bs-stop').click();release();
  await expect(page.locator('#bs-status')).toContainText('cancelled');await expect(page.locator('#bs-apply')).toBeDisabled();
  expect(remote.every(url=>!url.includes('esm.sh'))).toBe(true);
  await page.locator('#bs-mode').selectOption('white');await cutout(page);
});

test('turning optional connections off stops an active ImageSplat model download', async ({page}) => {
  await upload(page);await open(page);
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('https://huggingface.co/**',async route=>{await gate;await route.abort().catch(()=>{});});
  const downloading=page.waitForRequest(r=>r.url().startsWith('https://huggingface.co/'));
  await page.locator('#bs-process').click();await downloading;
  await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
  await expect(page.locator('#bs-status')).toContainText('Photo processing stopped');release();
  await expect(page.locator('#bs-process')).toBeEnabled();await expect(page.locator('#bs-apply')).toBeDisabled();
  await page.locator('#bs-mode').selectOption('white');await cutout(page);
});

test('solid exports, transparent layer application, mobile layout and keyboard close work', async ({page}) => {
  await upload(page);await open(page,'removeBg');await cutout(page);
  await page.locator('#bs-background').selectOption('color');await page.locator('#bs-fill').fill('#00ff00');await page.locator('#bs-fill').dispatchEvent('input');
  expect((await inspect(page,await save(page))).pixel).toEqual([0,255,0,255]);
  await page.locator('#bs-background').selectOption('transparent');await page.locator('#bs-format').selectOption('jpeg');
  const jpg=await inspect(page,await save(page));expect(jpg.pixel[3]).toBe(255);expect(jpg.pixel[0]).toBeGreaterThan(245);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator('#backgroundStudio').evaluate(d=>d.scrollWidth<=d.clientWidth)).toBe(true);
  await page.screenshot({path:'.tmp/backdropsplat/imagesplat-mobile.png'});
  await page.setViewportSize({width:1280,height:900});await page.locator('#backgroundStudio').evaluate(d=>d.scrollTop=0);await page.screenshot({path:'.tmp/backdropsplat/imagesplat-desktop.png'});
  await page.locator('#bs-apply').click();await open(page);expect((await pixel(page))[3]).toBe(0);await page.keyboard.press('Escape');
});

test('real photo cutout works through ImageSplat with the shared model and no uploads', async ({page}) => {
  test.skip(!process.env.BACKDROPSPLAT_REAL_AI,'Set BACKDROPSPLAT_REAL_AI=1 and BACKDROPSPLAT_PHOTO to verify real local inference.');test.setTimeout(180000);
  await upload(page,1,process.env.BACKDROPSPLAT_PHOTO);await open(page);
  const remote=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8792'))remote.push({url:r.url(),method:r.method(),body:r.postData()});});
  await page.locator('#bs-process').click();await expect(page.locator('#bs-apply')).toBeEnabled({timeout:160000});
  const alpha=await page.locator('#bs-result').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]<50)clear++;if(d[i]>200)solid++;}return{clear,solid};});
  expect(alpha.clear).toBeGreaterThan(50);expect(alpha.solid).toBeGreaterThan(50);expect(remote.length).toBeGreaterThan(0);
  expect(remote.every(r=>r.method==='GET'&&!r.body&&/(huggingface\.co|hf\.co)/.test(new URL(r.url).hostname))).toBe(true);
  await page.locator('#bs-apply').click();await expect(page.locator('#backgroundStudio')).toHaveCount(0);await open(page);
  expect((await page.locator('#bs-original').evaluate(c=>c.getContext('2d').getImageData(0,0,1,1).data[3]))).toBeLessThan(255);
});

async function replacementFile(page) {
  const data = await page.evaluate(() => {
    const c = document.createElement('canvas');c.width=140;c.height=70;const x=c.getContext('2d');
    x.fillStyle='#ff0000';x.fillRect(0,0,70,70);x.fillStyle='#0000ff';x.fillRect(70,0,70,70);return c.toDataURL().split(',')[1];
  });
  return {name:'new-background.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
}
async function uploadReplacement(page, file) {
  await page.locator('#bs-bg-file').setInputFiles(file);await expect(page.locator('#bs-bg-status')).toContainText('selected');await expect(page.locator('#bs-apply')).toBeEnabled();
}
async function selectBoth(page) {
  const stage=page.locator('#stage'),box=await stage.boundingBox(),native=await stage.evaluate(c=>({w:c.width,h:c.height}));
  await stage.click({position:{x:50*box.width/native.w,y:65*box.height/native.h}});
  await stage.click({position:{x:125*box.width/native.w,y:105*box.height/native.h},modifiers:['Shift']});
}

test('uploaded backgrounds preview behind cutouts, export PNG/JPEG, and apply with Undo/Redo',async({page})=>{
  await upload(page);await open(page,'removeBg');await cutout(page);
  let workers=0;page.on('worker',()=>workers++);
  await uploadReplacement(page,await replacementFile(page));await expect(page.locator('#bs-background')).toHaveValue('image');
  expect(await pixel(page,'bs-result',1,1)).toEqual([255,0,0,255]);expect(await pixel(page,'bs-result',69,1)).toEqual([0,0,255,255]);expect(await pixel(page,'bs-result',20,20)).toEqual([0,0,0,255]);
  const png=await save(page);expect(await inspect(page,png,1,1)).toEqual({width:70,height:70,pixel:[255,0,0,255]});
  await page.locator('#bs-format').selectOption('jpeg');const jpg=await inspect(page,await save(page),1,1);expect(jpg.pixel[0]).toBeGreaterThan(245);expect(jpg.pixel[3]).toBe(255);
  await page.locator('#bs-bg-fit').selectOption('contain');expect((await pixel(page,'bs-result'))).toEqual([255,255,255,255]);expect(await pixel(page,'bs-result',1,35)).toEqual([255,0,0,255]);
  await page.locator('#bs-bg-fit').selectOption('cover');await page.locator('#bs-background').selectOption('transparent');expect((await inspect(page,await save(page))).pixel[0]).toBeGreaterThan(245);
  await page.locator('#bs-format').selectOption('png');expect((await inspect(page,await save(page))).pixel[3]).toBe(0);
  await page.locator('#bs-background').selectOption('image');expect(workers).toBe(0);
  await page.locator('#bs-apply').click();await expect(page.locator('#backgroundStudio')).toHaveCount(0);await open(page);expect(await pixel(page)).toEqual([255,0,0,255]);await page.keyboard.press('Escape');
  await page.locator('.toolbar [data-action="undo"]').click();await selectImage(page);await open(page);expect(await pixel(page)).toEqual([255,255,255,255]);await page.keyboard.press('Escape');
  await page.locator('.toolbar [data-action="redo"]').click();await selectImage(page);await open(page);expect(await pixel(page)).toEqual([255,0,0,255]);
});

test('all six shared backgrounds work without external connections and Cancel leaves layers unchanged',async({page})=>{
  await upload(page);await open(page,'removeBg');await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
  const external=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8792'))external.push(r.url());});
  await page.getByRole('button',{name:'Studio Paper',exact:true}).click();await expect(page.locator('#bs-bg-status')).toContainText('Process your selected layers');await cutout(page);
  await expect(page.locator('.bs-bg-choice')).toHaveCount(6);
  for(const name of ['Studio Paper','Soft Lavender','Classroom Board','Splat Confetti','Mountain Morning','Coastal Calm']) {
    const button=page.getByRole('button',{name,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');await expect(page.locator('#bs-download')).toBeEnabled();expect((await inspect(page,await save(page))).pixel[3]).toBe(255);
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('#backgroundStudio').evaluate(d=>d.scrollTop=0);await page.screenshot({path:'.tmp/backdropsplat/imagesplat-replacement-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('#bs-replacement').scrollIntoViewIfNeeded();await expect.poll(()=>page.locator('#backgroundStudio').evaluate(d=>d.scrollWidth<=d.clientWidth)).toBe(true);await page.screenshot({path:'.tmp/backdropsplat/imagesplat-replacement-mobile.png'});
  await page.locator('#bs-bg-remove').click();await expect(page.locator('#bs-background')).toHaveValue('transparent');expect((await inspect(page,await save(page))).pixel[3]).toBe(0);
  await page.keyboard.press('Escape');await page.setViewportSize({width:1280,height:900});await open(page);expect(await pixel(page)).toEqual([255,255,255,255]);expect(external).toEqual([]);
});

test('a shared replacement is included in every ZIP image and batch Apply restores in one Undo',async({page})=>{
  await upload(page,2);await selectBoth(page);await open(page,'removeBg');await cutout(page);await uploadReplacement(page,await replacementFile(page));
  const bytes=await save(page,'bs-zip');const entries=await page.evaluate(async bytes=>{
    const z=await window.JSZip.loadAsync(new Uint8Array(bytes)),out=[];for(const[name,file]of Object.entries(z.files))out.push({name,bytes:[...await file.async('uint8array')]});return out;
  },[...bytes]);expect(entries.map(e=>e.name)).toEqual(['logo-cutout.png','logo-cutout-2.png']);
  for(const e of entries)expect((await inspect(page,e.bytes,69,1)).pixel).toEqual([0,0,255,255]);
  await page.locator('#bs-apply').click();await expect(page.locator('#backgroundStudio')).toHaveCount(0);
  for(let i=0;i<2;i++){await page.locator('#layerList .layer .name').nth(i).click();await open(page);expect(await pixel(page)).toEqual([255,0,0,255]);await page.keyboard.press('Escape');}
  await page.locator('.toolbar [data-action="undo"]').click();
  for(let i=0;i<2;i++){await page.locator('#layerList .layer .name').nth(i).click();await open(page);expect(await pixel(page)).toEqual([255,255,255,255]);await page.keyboard.press('Escape');}
});

test('online backgrounds use credential-free image GETs; failures and oversized files preserve the chosen backdrop',async({page})=>{
  await upload(page);await open(page,'removeBg');await cutout(page);const file=await replacementFile(page);let request;
  await page.route('https://backgrounds.example/image.png',async route=>{request=route.request();await route.fulfill({contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:file.buffer});});
  await page.locator('#bs-bg-url').fill('https://backgrounds.example/image.png');await page.locator('#bs-bg-load').click();await expect(page.locator('#bs-bg-status')).toContainText('Online image · backgrounds.example selected');
  expect(request.method()).toBe('GET');expect(request.postData()).toBeNull();expect(request.headers().referer).toBeUndefined();expect(request.headers().cookie).toBeUndefined();expect((await inspect(page,await save(page))).pixel).toEqual([255,0,0,255]);
  await page.locator('#bs-bg-url').fill('http://backgrounds.example/image.png');await page.locator('#bs-bg-load').click();await expect(page.locator('#bs-bg-status')).toContainText('HTTPS');
  await page.route('https://backgrounds.example/blocked.png',r=>r.abort('accessdenied'));await page.locator('#bs-bg-url').fill('https://backgrounds.example/blocked.png');await page.locator('#bs-bg-load').click();await expect(page.locator('#bs-bg-status')).toContainText('upload it here instead');
  await page.locator('#bs-bg-file').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('broken')});await expect(page.locator('#bs-bg-status')).toContainText('cannot open');
  await page.route('https://backgrounds.example/huge.png',r=>r.fulfill({headers:{'access-control-allow-origin':'*','content-length':'42000000'},contentType:'image/png',body:'x'}));await page.locator('#bs-bg-url').fill('https://backgrounds.example/huge.png');await page.locator('#bs-bg-load').click();await expect(page.locator('#bs-bg-status')).toContainText('over 40 MB');
  expect((await inspect(page,await save(page))).pixel).toEqual([255,0,0,255]);
});

test('online loading respects privacy, Cancel, and closing the studio without late changes',async({page})=>{
  await upload(page);await open(page,'removeBg');await cutout(page);await uploadReplacement(page,await replacementFile(page));
  await page.evaluate(()=>window.SplatPrivacy.setConnections(false));const external=[];page.on('request',r=>{if(r.url().startsWith('https://backgrounds.example'))external.push(r.url());});
  await page.locator('#bs-bg-url').fill('https://backgrounds.example/held.png');await page.locator('#bs-bg-load').click();await expect(page.locator('#bs-bg-status')).toContainText('Optional connections are off');expect(external).toEqual([]);
  await page.evaluate(()=>window.SplatPrivacy.setConnections(true));let release;const gate=new Promise(resolve=>{release=resolve;});await page.route('https://backgrounds.example/held.png',async r=>{await gate;await r.abort().catch(()=>{});});
  for(const action of ['cancel','privacy','close']) {
    const pending=page.waitForRequest(r=>r.url().startsWith('https://backgrounds.example'));await page.locator('#bs-bg-load').click();await pending;await expect(page.locator('#bs-apply')).toBeDisabled();
    if(action==='cancel')await page.locator('#bs-bg-stop').click();
    else if(action==='privacy')await page.evaluate(()=>window.SplatPrivacy.setConnections(false));
    else await page.keyboard.press('Escape');
    if(action==='close'){await expect(page.locator('#backgroundStudio')).toHaveCount(0);break;}
    await expect(page.locator('#bs-bg-status')).toContainText(action==='cancel'?'cancelled':'optional connections are off');await expect(page.locator('#bs-apply')).toBeEnabled();expect((await inspect(page,await save(page))).pixel).toEqual([255,0,0,255]);await page.evaluate(()=>window.SplatPrivacy.setConnections(true));
  }
  release();await open(page,'removeBg');expect(await pixel(page)).toEqual([255,255,255,255]);await expect(page.locator('#bs-background')).toHaveValue('transparent');
  await page.locator('#bs-cancel').click();await page.locator('.toolbar [data-action="undo"]').click();await expect(page.locator('#layerList .layer')).toHaveCount(0);
});
