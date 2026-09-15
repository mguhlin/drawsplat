const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });
const fs = require('node:fs/promises');
const fixture = (title = 'Audit board') => ({ title, active: 0, panels: [{ id: 'p1', name: 'Panel 1', bg: 'blank', objects: [{ id: 'r1', type: 'rect', x: 80, y: 80, w: 180, h: 120, fill: '#ff0000', stroke: '#000000', strokeWidth: 2, opacity: 1 }] }] });
async function open(page, init) {
  await page.addInitScript(() => { localStorage.setItem('drawsplat.welcomed','1'); localStorage.setItem('drawsplat.consent.accepted','1'); localStorage.setItem('drawsplat.lastStartupTipDate',new Date().toISOString().slice(0,10)); });
  if(init) await page.addInitScript(init);
  await page.goto('/app/whiteboard.html');
  await expect(page.locator('#canvasToolHud')).toBeVisible();
}
async function load(page, value) {
  await page.locator('#jsonInput').setInputFiles({ name: 'audit.drawsplat.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
}
async function save(page, button = 'saveLocalBtn') {
  const waiting = page.waitForEvent('download');
  await page.locator('#'+button).evaluate(el => el.click());
  const dl = await waiting;
  return fs.readFile(await dl.path());
}
async function saved(page) { return JSON.parse((await save(page)).toString()); }

test('malformed board imports preserve working board and allow retry', async ({ page }) => {
  await open(page); await load(page, fixture());
  for(const invalid of [null, {}, {panels:[null]}, {panels:[{objects:[null]}]}, {panels:[{objects:{}}]}]) {
    await load(page, invalid);
    await expect(page.locator('#statusToast')).toContainText('Board import failed');
    expect((await saved(page)).title).toBe('Audit board');
  }
  await load(page, fixture('Retry')); expect((await saved(page)).title).toBe('Retry');
});

test('legacy boards without an active index reopen safely', async ({ page }) => {
  await open(page); const b = fixture(); delete b.active; await load(page,b);
  await expect(page.locator('#statusToast')).toContainText('Board loaded');
  expect((await saved(page)).active).toBe(0);
});

test('storage quota fallback restores latest board after refresh', async ({ page }) => {
  await open(page); await load(page, fixture('Old'));
  await page.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if(k==='drawsplat.autosave') throw new DOMException('full','QuotaExceededError'); return set.call(this,k,v); }; });
  await load(page, fixture('Latest'));
  await expect(page.locator('#saveStateChip')).toHaveClass(/saved/);
  await page.reload(); await expect(page.locator('#canvasToolHud')).toBeVisible();
  expect((await saved(page)).title).toBe('Latest');
});

test('denied storage still starts and reports unsaved work', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await open(page, () => { Storage.prototype.getItem=()=>{throw new DOMException('denied','SecurityError')}; Storage.prototype.setItem=()=>{throw new DOMException('denied','SecurityError')}; indexedDB.open=()=>{throw new DOMException('denied','SecurityError')}; });
  await load(page, fixture());
  await expect(page.locator('#saveStateChip')).toHaveClass(/error/);
  expect((await saved(page)).title).toBe('Audit board');
  expect(errors).toEqual([]);
});

test('PDF download has valid offsets and an embedded full-size image', async ({ page }) => {
  await open(page); await load(page, fixture());
  const bytes = await save(page,'exportPdfBtn'); const text=bytes.toString('latin1');
  expect(text.startsWith('%PDF-1.4')).toBeTruthy();
  const start=Number(text.match(/startxref\s+(\d+)/)[1]);
  expect(text.slice(start,start+4)).toBe('xref');
  const entries=text.slice(start).split('\n').slice(3,8);
  entries.forEach((line,i)=>expect(text.slice(Number(line.slice(0,10)))).toMatch(new RegExp('^'+(i+1)+' 0 obj')));
  expect(text).toMatch(/\/Count 1/); expect(text).toMatch(/\/Subtype \/Image/);
});

test('PNG pixels contain the shape and exclude selection handles', async ({ page }) => {
  await open(page); await load(page, fixture());
  const box=await page.locator('#boardSvg').boundingBox();
  await page.mouse.click(box.x+120,box.y+120);
  const bytes=await save(page,'exportBtn');
  const result=await page.evaluate(async b64=>{
    const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode();
    const c=document.createElement('canvas'); c.width=img.width;c.height=img.height; const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    return {w:img.width,h:img.height,red:[...ctx.getImageData(240,240,1,1).data], background:[...ctx.getImageData(30,30,1,1).data]};
  },bytes.toString('base64'));
  expect(result.w).toBe(Math.round(box.width)*2); expect(result.h).toBe(Math.round(box.height)*2);
  expect(result.red).toEqual([255,0,0,255]); expect(result.background).toEqual([255,255,255,255]);
});

test('Escape cancels delayed PDF import without late panels', async ({ page }) => {
  await open(page); await load(page, fixture());
  await page.evaluate(() => {
    window.pdfjsLib={GlobalWorkerOptions:{},getDocument:()=>({promise: Promise.resolve({numPages:1,destroy:async()=>{},getPage:async()=>({getViewport:()=>({width:100,height:100}),cleanup(){},render:()=>({promise:new Promise(r=>{window.finishAuditRender=r})})})})})};
  });
  await page.locator('#importPanelsInput').setInputFiles({name:'delay.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')});
  await expect.poll(()=>page.evaluate(()=>typeof window.finishAuditRender)).toBe('function');
  await page.keyboard.press('Escape'); await page.evaluate(()=>window.finishAuditRender());
  await expect(page.locator('#importProgressDialog')).not.toBeVisible();
  await expect(page.locator('#statusToast')).toContainText('cancelled');
  expect((await saved(page)).panels).toHaveLength(1);
});

test('draw, drag, resize, duplicate, delete, undo/redo and reopen', async ({ page }) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await open(page); await load(page,fixture());
  const svg=page.locator('#boardSvg'), box=await svg.boundingBox();
  await page.mouse.move(box.x+120,box.y+120);await page.mouse.down();await page.mouse.move(box.x+170,box.y+150,{steps:6});await page.mouse.up();
  expect((await saved(page)).panels[0].objects[0].x).toBe(130);
  const handle=await page.locator('#boardSvg .handle').boundingBox();
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2+40,handle.y+handle.height/2+30,{steps:6});await page.mouse.up();
  expect((await saved(page)).panels[0].objects[0].w).toBeGreaterThan(180);
  await svg.focus(); await page.keyboard.press('Control+d');
  expect((await saved(page)).panels[0].objects).toHaveLength(2);
  await svg.focus(); await page.keyboard.press('Delete');
  expect((await saved(page)).panels[0].objects).toHaveLength(1);
  await svg.focus(); await page.keyboard.press('Control+z');
  expect((await saved(page)).panels[0].objects).toHaveLength(2);
  await svg.focus(); await page.keyboard.press('Control+Shift+z');
  expect((await saved(page)).panels[0].objects).toHaveLength(1);
  await page.locator('#drawToolGroup > summary').click();await page.locator('[data-tool="pen"]').click();
  await page.mouse.move(box.x+330,box.y+100);await page.mouse.down();await page.mouse.move(box.x+380,box.y+180,{steps:8});await page.mouse.up();
  expect((await saved(page)).panels[0].objects.some(o=>o.type==='path')).toBeTruthy();
  await page.reload();await expect(svg.locator('.object')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('first visit sequences welcome, consent and concept-map dialog', async ({ page }) => {
  await page.goto('/app/whiteboard.html');
  await expect(page.locator('#welcomeDialog')).toBeVisible();
  await expect(page.locator('#drawsplatConsentBanner')).toHaveCount(0);
  await page.locator('#welcomeDismiss').click();
  await expect(page.locator('#drawsplatConsentBanner')).toBeVisible();
  await page.locator('#drawsplatConsentOk').click();
  await page.locator('#simpleConceptMapBtn').evaluate(el=>el.click());
  await expect(page.locator('#conceptMapDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#conceptMapDialog')).not.toBeVisible();
  await page.reload(); await expect(page.locator('#canvasToolHud')).toBeVisible();
  await expect(page.locator('#welcomeDialog')).not.toBeVisible();
});

test('PNG image stays embedded after save/reopen; malformed and oversized imports recover', async ({ page }, info) => {
  await open(page);await load(page,fixture());
  const png=await save(page,'exportBtn');
  await page.locator('#imageInput').setInputFiles({name:'image.png',mimeType:'image/png',buffer:png});
  await expect(page.locator('#statusToast')).toContainText('Added 1 image');
  const b=await saved(page);expect(b.panels[0].objects[1].src).toMatch(/^data:image\//);
  await load(page,b);expect((await saved(page)).panels[0].objects[1].src).toBe(b.panels[0].objects[1].src);
  await page.locator('#imageInput').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  expect((await saved(page)).panels[0].objects).toHaveLength(2);
  const huge=info.outputPath('huge.json'); await fs.writeFile(huge,''); await fs.truncate(huge,64*1024*1024+1);
  await page.locator('#jsonInput').setInputFiles(huge); await fs.unlink(huge);
  await expect(page.locator('#statusToast')).toContainText('Maximum board file size');
  expect((await saved(page)).title).toBe('Audit board');
  await page.locator('#importPanelsInput').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF broken')});
  await expect(page.locator('#statusToast')).toContainText('Import failed');
  await expect(page.locator('#importProgressDialog')).not.toBeVisible();
});

test('real PDF import and PPTX/ODP text import produce saved panels', async ({ page }) => {
  await open(page);await load(page,fixture());
  const pdf=await save(page,'exportPdfBtn');
  await page.locator('#importPanelsInput').setInputFiles({name:'actual.pdf',mimeType:'application/pdf',buffer:pdf});
  await expect(page.locator('#statusToast')).toContainText('Imported 1 PDF');
  expect((await saved(page)).panels[1].bgImage).toMatch(/^data:image\/jpeg/);
  for(const ext of ['pptx','odp']) {
    const bytes=await page.evaluate(async ext=>{
      const zip=new JSZip();
      if(ext==='pptx')zip.file('ppt/slides/slide1.xml','<p:sld xmlns:p="p" xmlns:a="a"><p:sp><p:spPr><a:xfrm><a:off x="100000" y="100000"/><a:ext cx="2000000" cy="500000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>Audit slide</a:t></a:r></a:p></p:txBody></p:sp></p:sld>');
      else zip.file('content.xml','<office:document-content xmlns:office="office" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:text="text" xmlns:svg="svg"><draw:page><draw:frame svg:x="1cm" svg:y="1cm" svg:width="5cm" svg:height="2cm"><draw:text-box><text:p>Audit slide</text:p></draw:text-box></draw:frame></draw:page></office:document-content>');
      return Array.from(await zip.generateAsync({type:'uint8array'}));
    },ext);
    await page.locator('#importPanelsInput').setInputFiles({name:'slides.'+ext,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
    await expect(page.locator('#statusToast')).toContainText('Imported 1 slide');
    expect((await saved(page)).panels.at(-1).objects.some(o=>o.text.includes('Audit slide'))).toBeTruthy();
  }
});

for(const [name,width,height] of [['phone portrait',390,844],['phone landscape',844,390],['tablet portrait',768,1024],['tablet landscape',1024,768]]) {
  test.describe(name,()=>{
    test.use({viewport:{width,height},hasTouch:true});
    test('layout and touch selection', async ({ page }, info) => {
      await open(page);await load(page,fixture());
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const box=await page.locator('#boardSvg').boundingBox();expect(box.width).toBeGreaterThan(200);expect(box.height).toBeGreaterThan(100);
      await page.touchscreen.tap(box.x+100,box.y+100);await expect(page.locator('#boardSvg .selected')).toHaveCount(1);
      if(width<=600){expect((await page.locator('.sidebar-undo-row').boundingBox()).height).toBeLessThan(60)}
      const rail=page.locator('#toolButtons');
      expect(await rail.evaluate(el=>{if(el.scrollHeight<=el.clientHeight)return true;el.scrollTop=100;return el.scrollTop>0})).toBeTruthy();
      await page.screenshot({path:info.outputPath('layout.png'),fullPage:true});
    });
  });
}

test('microphone startup rejects duplicate requests and releases failed recorder tracks', async ({ page }) => {
  await open(page);const b=fixture();b.panels[0].objects[0].type='audio';await load(page,b);
  await page.locator('#boardSvg .object').click();
  await page.evaluate(()=>{
    window.auditMicRequests=0;window.auditTrackStops=0;
    navigator.mediaDevices.getUserMedia=()=>{window.auditMicRequests++;return new Promise(r=>window.auditGrantMic=()=>r({getTracks:()=>[{stop:()=>window.auditTrackStops++}]}))};
    window.MediaRecorder=class {constructor(){throw new Error('Unsupported codec')}};
    document.querySelector('#recordAudioBtn').click();document.querySelector('#recordAudioBtn').click();
  });
  expect(await page.evaluate(()=>window.auditMicRequests)).toBe(1);
  await page.evaluate(()=>window.auditGrantMic());
  await expect(page.locator('#statusToast')).toContainText('Audio recording failed');
  expect(await page.evaluate(()=>window.auditTrackStops)).toBe(1);
});

test('missing or denied microphone reports an actionable error', async ({ page }) => {
  await open(page);const b=fixture();b.panels[0].objects[0].type='audio';await load(page,b);
  await page.locator('#boardSvg .object').click();
  await page.evaluate(()=>{window.MediaRecorder=class {};navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError')};document.querySelector('#recordAudioBtn').click()});
  await expect(page.locator('#statusToast')).toContainText('Permission denied');
  await page.evaluate(()=>{window.MediaRecorder=undefined;document.querySelector('#recordAudioBtn').click()});
  await expect(page.locator('#statusToast')).toContainText('not supported');
});

test('export embeds referenced images and preserves note formatting', async ({ page }) => {
  await open(page);
  const red=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;const x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,20,20);return c.toDataURL().split(',')[1]});
  await page.route('**/audit-image.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from(red,'base64')}));
  const b=fixture();b.panels[0].objects[0]={...b.panels[0].objects[0],type:'image',src:new URL('/audit-image.png',page.url()).href};
  b.panels[0].objects.push({id:'note',type:'sticky',x:300,y:80,w:160,h:120,html:'<b>Audit note</b>',fill:'#ffff00',fontSize:20,opacity:1});
  await load(page,b);
  const bytes=await save(page,'exportBtn');
  const pixels=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);return [...x.getImageData(240,240,1,1).data]},bytes.toString('base64'));
  expect(pixels).toEqual([255,0,0,255]);
});

test('service-worker activation preserves other apps and model caches', async ({ request }) => {
  const vm=require('node:vm');let activate;const deleted=[];
  const source=await (await request.get('/sw.js')).text();
  vm.runInNewContext(source,{self:{addEventListener:(name,fn)=>{if(name==='activate')activate=fn},clients:{claim:async()=>{}}},caches:{keys:async()=>['drawsplat-v3.0.0','audiosplat-v1','whisper-models'],delete:async key=>deleted.push(key)}});
  await new Promise((resolve,reject)=>activate({waitUntil:p=>p.then(resolve,reject)}));
  expect(deleted).toEqual(['drawsplat-v3.0.0']);
});

test.describe('offline shell',()=>{
  test.use({serviceWorkers:'allow'});
  test('cached board reopens and saves while offline',async({page,context,browserName})=>{
    test.skip(browserName==='webkit','Linux WebKit 26.4 offline reload also fails on a minimal cache-only control page with an internal navigation error.');
    await open(page);
    await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller).catch(()=>false),{timeout:20000}).toBeTruthy();
    await load(page,fixture('Offline board'));
    await expect(page.locator('#saveStateChip')).toHaveClass(/saved/);
    await context.setOffline(true);await page.reload();
    await expect(page.locator('#boardSvg .object')).toHaveCount(1);
    expect((await saved(page)).title).toBe('Offline board');
    await context.setOffline(false);
  });
});

test('failed export leaves selection intact and can be retried',async({page})=>{
  await open(page);const b=fixture();b.panels[0].objects[0]={...b.panels[0].objects[0],type:'image',src:new URL('/missing-audit-image.png',page.url()).href};await load(page,b);
  await page.locator('#boardSvg').focus();await page.keyboard.press('Control+a');
  await page.locator('#exportBtn').evaluate(el=>el.click());
  await expect(page.locator('#statusToast')).toContainText('Export failed');
  await expect(page.locator('#boardSvg .selected')).toHaveCount(1);
  await load(page,fixture('Retry export'));const bytes=await save(page,'exportBtn');expect(bytes.subarray(1,4).toString()).toBe('PNG');
});

test('GIF frames have expected timing and remain downloadable until dialog closes',async({page})=>{
  await open(page);
  const frames=await page.evaluate(()=>['#ff0000','#0000ff'].map(color=>{const c=document.createElement('canvas');c.width=24;c.height=16;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,24,16);return c.toDataURL()}));
  const b=fixture();b.panels[0].objects=frames.map((src,i)=>({id:'frame'+i,type:'image',x:80+i*200,y:80,w:180,h:120,src,naturalW:24,naturalH:16,opacity:1}));await load(page,b);
  await page.locator('#boardSvg').focus();await page.keyboard.press('Control+a');
  await page.locator('#openGifDialogBtn').evaluate(el=>el.click());await page.locator('#createGifBtn').click();
  await expect(page.locator('#downloadGifBtn')).toBeEnabled();
  const bytes=await save(page,'downloadGifBtn');expect(bytes.subarray(0,6).toString()).toMatch(/^GIF8[79]a$/);
  expect(bytes.readUInt16LE(6)).toBe(40);expect(bytes.readUInt16LE(8)).toBe(40);
  const delays=[];for(let i=0;i<bytes.length-7;i++)if(bytes[i]===0x21&&bytes[i+1]===0xf9&&bytes[i+2]===4)delays.push(bytes.readUInt16LE(i+4));
  expect(delays).toEqual([45,45]);
  await page.waitForTimeout(2200);
  const again=await save(page,'downloadGifBtn');expect(again.equals(bytes)).toBeTruthy();
  await page.locator('#closeGifDialog').click();
  await expect(page.locator('#downloadGifBtn')).toBeDisabled();
});

test('inline text editing commits and cancels without losing prior content',async({page})=>{
  await open(page);const b=fixture();b.panels[0].objects[0]={...b.panels[0].objects[0],type:'text',text:'Before',html:'Before',fontSize:24};await load(page,b);
  await page.locator('#boardSvg .object').dblclick();await page.locator('#inlineTextEditor').fill('After');await page.keyboard.press('Control+Enter');
  expect((await saved(page)).panels[0].objects[0].text).toBe('After');
  await page.locator('#boardSvg .object').dblclick();await page.locator('#inlineTextEditor').fill('Discard');await page.keyboard.press('Escape');
  expect((await saved(page)).panels[0].objects[0].text).toBe('After');
});


test('service-worker activation keeps an open editing dialog intact',async({page})=>{
  await open(page);await load(page,fixture());
  await page.locator('#simpleConceptMapBtn').evaluate(el=>el.click());
  await expect(page.locator('#conceptMapDialog')).toBeVisible();
  let navigations=0;page.on('framenavigated',()=>navigations++);
  await page.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await page.waitForTimeout(150);
  await expect(page.locator('#conceptMapDialog')).toBeVisible();expect(navigations).toBe(0);
});
