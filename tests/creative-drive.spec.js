const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {PDFDocument,StandardFonts}=require('../solutions/pdfsplat/vendor/pdf-lib.min.js');
const JSZip=require('../vendor/jszip.min.js');
const apps=['pdfsplat','videosplat','mediasplat','markdown-studio','concept-map','mermaid'];
const isolated=new Set(['pdfsplat','videosplat','mediasplat']);
const scope='https://www.googleapis.com/auth/drive.file';
test.use({serviceWorkers:'block'});
test.beforeEach(async({context})=>{
 await context.addInitScript(()=>{
  try { localStorage.setItem('drawsplat.consent.accepted','1');localStorage.setItem('drawsplat.language','en');sessionStorage.setItem('videosplat-splash-seen','1'); } catch {}
  document.addEventListener('DOMContentLoaded',()=>{const m=document.createElement('meta');m.name='google-drive-client-id';m.content='synthetic-client.apps.googleusercontent.com';document.head.append(m);},{once:true});
 });
 // Exercise real COOP separation even when the CI static server supplies no headers.
 await context.route('**/*',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(!/^\/solutions\/(pdfsplat|videosplat|mediasplat)\//.test(path)&&!path.includes('/shared/google-drive-auth'))return route.continue();
  const response=await route.fetch(),helper=path.includes('/shared/google-drive-auth');
  await route.fulfill({response,headers:{...response.headers(),'cross-origin-opener-policy':helper?'same-origin-allow-popups':'same-origin','cross-origin-embedder-policy':helper?'unsafe-none':'require-corp'}});
 });
});
async function google(context,response={access_token:'synthetic-drive-token',scope}){
 const seen={identity:0,uploads:[]};
 await context.route('https://accounts.google.com/gsi/client',route=>{seen.identity++;return route.fulfill({contentType:'application/javascript',body:`window.google={accounts:{oauth2:{hasGrantedAllScopes:(r,s)=>r.scope?.split(' ').includes(s),initTokenClient:c=>({requestAccessToken:()=>c.callback(${JSON.stringify(response)})})}}};`});});
 await context.route('https://www.googleapis.com/**',route=>{
  const r=route.request();if(r.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,X-Upload-Content-Type,X-Upload-Content-Length'}});if(r.url().includes('/upload/'))seen.uploads.push(r);
  return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'},body:'{"id":"synthetic-file-123"}'});
 });return seen;
}
function wave(){const b=Buffer.alloc(44+16000*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);return b;}
async function ready(page,app){
 await page.goto('/solutions/'+app+'/?lang=en');
 if(app==='pdfsplat'){
  const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);pdf.addPage([400,600]).drawText('Synthetic PDF source',{x:40,y:500,font,size:16});
  await page.locator('#fileInput').setInputFiles({name:'classroom.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await expect(page.locator('#saveDriveButton')).toBeEnabled();await page.locator('#addTextButton').click();await page.locator('#annotationLayer').press('Enter');await page.locator('#textValue').fill('Synthetic annotation');
 }else if(app==='mediasplat'){
  await page.locator('input[type=file]').first().setInputFiles({name:'classroom.wav',mimeType:'audio/wav',buffer:wave()});await page.getByLabel('End time',{exact:true}).fill('0.3');await page.getByRole('button',{name:'Trim media',exact:true}).click();await expect(page.getByRole('region',{name:'Output files'})).toBeVisible({timeout:60000});
 }else if(app==='videosplat')await expect(page.getByRole('menuitem',{name:'File',exact:true})).toBeVisible();
 else if(app==='markdown-studio')await page.locator('#md-input').fill('# Synthetic classroom draft\n\nKeep **this** text.');
 else if(app==='mermaid')await page.locator('#mermaidSource').fill('flowchart TD\n A[Synthetic classroom] --> B[Saved source]');
 else {
  await page.locator('#startDialogCloseBtn').click();
  page.once('dialog',dialog=>dialog.type()==='confirm'?dialog.accept():dialog.dismiss());
  await page.locator('#jsonInput').setInputFiles({name:'classroom.drawsplat-cmap.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'drawsplat-concept-map',version:2,nodes:[{id:'synthetic',label:'Synthetic classroom concept',x:100,y:100,w:220,h:90,level:0}],connectors:[],groups:[]}))});
 }
}
async function openDrive(page,app){
 if(app==='videosplat'){await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Save project to Google Drive',exact:true}).click();}
 else if(app==='pdfsplat')await page.locator('#saveDriveButton').click();
 else if(app==='markdown-studio')await page.locator('#btn-save-drive').click();
 else if(app==='mediasplat')await page.getByRole('region',{name:'Output files'}).getByRole('button',{name:'Save to Google Drive',exact:true}).click();
 else if(app==='concept-map'){await page.locator('#quickSaveAsMenu > summary').click();await page.locator('#quickSaveAsMenu [data-click-target=saveDriveBtn]').click();}
 else await page.locator('#saveDriveBtn').click();
 const dialog=page.getByRole('dialog',{name:'Save to Google Drive',exact:true});await expect(dialog).toBeVisible();return dialog;
}
// Authorization success/cancellation may close its own window before Chromium
// acknowledges the input command. The parent result is asserted by each test.
async function clickAuthorizationButton(helper,selector){
 try{await helper.locator(selector).click({noWaitAfter:true});}
 catch(error){if(!helper.isClosed()||!String(error.message).includes('has been closed'))throw error;}
}
async function cancelAuthorization(helper){
 const closed=helper.waitForEvent('close');await clickAuthorizationButton(helper,'#cancel');await closed;
}
async function authorize(context,dialog,app){
 await expect(dialog.getByRole('button',{name:'Save to Google Drive',exact:true})).toBeEnabled();
 let helper;
 if(isolated.has(app)){
  const event=context.waitForEvent('page');await dialog.getByRole('button',{name:'Save to Google Drive',exact:true}).click();helper=await event;
  await expect(helper.locator('#authorize')).toBeEnabled();expect(await helper.evaluate(()=>crossOriginIsolated)).toBe(false);await clickAuthorizationButton(helper,'#authorize');
 }else await dialog.getByRole('button',{name:'Save to Google Drive',exact:true}).click();
 return helper;
}
async function localFile(page,app){
 const event=page.waitForEvent('download');
 if(app==='pdfsplat')await page.locator('#saveAsSelect').selectOption('pdf');
 else if(app==='videosplat'){await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Save project copy',exact:true}).click();}
 else if(app==='mediasplat')await page.getByRole('region',{name:'Output files'}).getByRole('button',{name:'Download',exact:true}).click();
 else await page.locator(app==='markdown-studio'?'#btn-save-md':app==='concept-map'?'#quickSaveWorkBtn':'#saveSourceBtn').click();
 const d=await event;return {bytes:fs.readFileSync(await d.path()),name:d.suggestedFilename()};
}
function multipart(request){
 const body=request.postDataBuffer(),boundary=request.headers()['content-type'].split('boundary=')[1];
 const marker=Buffer.from('\r\n--'+boundary+'\r\n'),middle=body.indexOf(marker);
 return {metadata:JSON.parse(body.subarray(body.indexOf('\r\n\r\n')+4,middle).toString()),bytes:body.subarray(body.indexOf('\r\n\r\n',middle+marker.length)+4,body.lastIndexOf('\r\n--'+boundary+'--'))};
}
for(const app of apps){
 test(app+': Drive saves the current file and the existing local save remains usable',async({page,context})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));if(process.env.CREATIVE_DEBUG)page.on('console',m=>{if(m.type()==='error')console.log(m.text());});const seen=await google(context);await ready(page,app);expect(seen.identity).toBe(0);expect(seen.uploads).toHaveLength(0);
  if(isolated.has(app))expect(await page.evaluate(()=>crossOriginIsolated)).toBe(true);
  const dialog=await openDrive(page,app);if(app==='videosplat')await expect(dialog).toContainText('Keep the original media');
  await authorize(context,dialog,app);await expect(dialog.getByRole('status')).toContainText('Saved ',{timeout:30000});expect(seen.uploads).toHaveLength(1);
  const uploaded=multipart(seen.uploads[0]);expect(uploaded.metadata).not.toHaveProperty('permissions');await dialog.getByRole('button',{name:'Done',exact:true}).click();
  const local=await localFile(page,app);expect(uploaded.metadata.name).toBe(local.name);
  if(app==='concept-map'){const a=JSON.parse(uploaded.bytes),b=JSON.parse(local.bytes);delete a.saved;delete b.saved;expect(a).toEqual(b);expect(a.nodes[0].label).toContain('Synthetic');}
  else if(app==='videosplat')expect(JSON.parse(uploaded.bytes)).toEqual(JSON.parse(local.bytes));
  else if(app==='pdfsplat'){
   const texts=await page.evaluate(async entries=>{const result=[];for(const bytes of entries){const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;result.push((await(await doc.getPage(1)).getTextContent()).items.map(x=>x.str).join(' '));await doc.destroy();}return result;},[[...uploaded.bytes],[...local.bytes]]);
   expect(texts[0]).toBe(texts[1]);expect(texts[0].replace(/\s+/g,' ')).toContain('Synthetic annotation');expect((await PDFDocument.load(uploaded.bytes)).getPageCount()).toBe(1);
  }else expect(uploaded.bytes.equals(local.bytes)).toBe(true);
  expect(errors).toEqual([]);expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/token/i.test(k)))).toEqual([]);
 });
 test(app+': cancelling Drive leaves the local file available and uploads nothing',async({page,context})=>{
  const seen=await google(context);await ready(page,app);const before=await localFile(page,app);const dialog=await openDrive(page,app);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect(seen.uploads).toHaveLength(0);const after=await localFile(page,app);expect(after.name).toBe(before.name);expect(after.bytes.length).toBeGreaterThan(0);
 });
 test(app+': optional-connection opt-out blocks Google authorization and upload',async({page,context})=>{
  const seen=await google(context);await ready(page,app);await page.evaluate(()=>window.SplatPrivacy.setConnections(false));const dialog=await openDrive(page,app);await expect(dialog.getByRole('status')).toContainText('External connections are off');expect(seen.identity).toBe(0);expect(seen.uploads).toHaveLength(0);
 });
}
test('isolated authorization can be cancelled without losing the open PDF',async({page,context})=>{
 const seen=await google(context);await ready(page,'pdfsplat');const dialog=await openDrive(page,'pdfsplat');const event=context.waitForEvent('page');await dialog.getByRole('button',{name:'Save to Google Drive',exact:true}).click();const helper=await event;await expect(helper.locator('#authorize')).toBeEnabled();await cancelAuthorization(helper);await expect(dialog.getByRole('status')).toContainText('transfer stopped');expect(seen.uploads).toHaveLength(0);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#saveDriveButton')).toBeEnabled();expect(await page.evaluate(()=>crossOriginIsolated)).toBe(true);
});
test('denied Google access stays recoverable in the isolated authorization window',async({page,context})=>{
 const seen=await google(context,{error:'access_denied'});await ready(page,'pdfsplat');const dialog=await openDrive(page,'pdfsplat');const helper=await authorize(context,dialog,'pdfsplat');await expect(helper.getByRole('status')).toContainText('permission was not granted');expect(seen.uploads).toHaveLength(0);await cancelAuthorization(helper);await expect(dialog.getByRole('button',{name:'Save to Google Drive',exact:true})).toBeEnabled();
});
test('Mermaid source saved from Drive can be opened locally for editing',async({page,context})=>{
 const seen=await google(context);await ready(page,'mermaid');const original=await page.locator('#mermaidSource').inputValue();const dialog=await openDrive(page,'mermaid');await authorize(context,dialog,'mermaid');await expect(dialog.getByRole('status')).toContainText('Saved ');const file=multipart(seen.uploads[0]);await dialog.getByRole('button',{name:'Done',exact:true}).click();await page.locator('#mermaidSource').fill('flowchart TD\n X --> Y');await page.locator('#sourceFile').setInputFiles({name:file.metadata.name,mimeType:'text/plain',buffer:file.bytes});await expect(page.locator('#mermaidSource')).toHaveValue(original);
});
test('renaming a Markdown Drive save preserves its file extension',async({page,context})=>{
 const seen=await google(context);await ready(page,'markdown-studio');const dialog=await openDrive(page,'markdown-studio');await dialog.getByRole('textbox',{name:'File name'}).fill('Renamed classroom copy');await authorize(context,dialog,'markdown-studio');await expect(dialog.getByRole('status')).toContainText('Saved ');expect(multipart(seen.uploads[0]).metadata.name).toBe('Renamed classroom copy.md');
});
test('VideoSplat saves the rendered playable video and keeps its local download',async({page,context})=>{
 test.setTimeout(60000);const seen=await google(context);await ready(page,'videosplat');
 await page.locator('input[accept*=".srt"]').setInputFiles({name:'classroom.srt',mimeType:'application/x-subrip',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:00,400\nSynthetic classroom caption')});
 await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Export video…',exact:true}).click();
 await page.getByLabel('Export format').selectOption('webm');await page.getByLabel('Export width').fill('160');await page.getByLabel('Export height').fill('90');await page.getByLabel('Export frame rate').fill('10');await page.getByText('Include timeline audio',{exact:true}).click();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:/^Render local WebM$/i}).click();const download=await pending;const local=fs.readFileSync(await download.path());await page.getByRole('button',{name:'Save video to Google Drive',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Save to Google Drive',exact:true});await authorize(context,dialog,'videosplat');await expect(dialog.getByRole('status')).toContainText('Saved ');const file=multipart(seen.uploads[0]);expect(file.metadata.name).toBe(download.suggestedFilename());expect(file.bytes.equals(local)).toBe(true);expect(file.bytes.length).toBeGreaterThan(100);
});
test('MediaSplat saves all split output files in a Drive ZIP with local-equivalent contents',async({page,context})=>{
 test.setTimeout(60000);const seen=await google(context);await page.goto('/solutions/mediasplat/');await page.getByRole('navigation',{name:'Media tools'}).getByRole('button',{name:/Split/}).click();await page.locator('input[type=file]').first().setInputFiles({name:'classroom.wav',mimeType:'audio/wav',buffer:wave()});await page.getByRole('button',{name:'Split media',exact:true}).click();await expect(page.getByRole('button',{name:'Save all to Google Drive',exact:true})).toBeVisible({timeout:45000});
 await page.getByRole('button',{name:'Save all to Google Drive',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Save to Google Drive',exact:true});await authorize(context,dialog,'mediasplat');await expect(dialog.getByRole('status')).toContainText('Saved ');const file=multipart(seen.uploads[0]);expect(file.metadata.name).toBe('classroom-parts.zip');await dialog.getByRole('button',{name:'Done',exact:true}).click();const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download all as ZIP',exact:true}).click();const local=fs.readFileSync(await(await event).path());const uploaded=await JSZip.loadAsync(file.bytes),downloaded=await JSZip.loadAsync(local);expect(Object.keys(uploaded.files)).toEqual(Object.keys(downloaded.files));expect(Object.keys(uploaded.files)).toHaveLength(2);for(const name of Object.keys(uploaded.files))expect((await uploaded.file(name).async('nodebuffer')).equals(await downloaded.file(name).async('nodebuffer'))).toBe(true);
});
for(const format of ['SRT','transcript'])test('MediaSplat saves generated '+format+' to Drive without changing its local export',async({page,context})=>{
 const {fakeTranscriber}=require('../solutions/shared/subtitles/tests/browser.ts');await fakeTranscriber(page);const seen=await google(context);await page.goto('/solutions/mediasplat/');await page.getByRole('navigation',{name:'Media tools'}).getByRole('button',{name:/Transcribe/}).click();await page.locator('input[type=file]').first().setInputFiles(require('node:path').resolve('solutions/shared/subtitles/tests/speech.mp4'));await page.getByRole('button',{name:'Generate subtitles',exact:true}).click();await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');await page.getByLabel('Caption 1 text').fill('Synthetic reviewed caption');await page.getByRole('button',{name:format==='SRT'?'Save SRT to Google Drive':'Save transcript to Google Drive',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Save to Google Drive',exact:true});await authorize(context,dialog,'mediasplat');await expect(dialog.getByRole('status')).toContainText('Saved ');const uploaded=multipart(seen.uploads[0]);await dialog.getByRole('button',{name:'Done',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:format==='SRT'?'Download SRT':'Download transcript (.txt)',exact:true}).click();const local=await pending;expect(uploaded.metadata.name).toBe(local.suggestedFilename());expect(uploaded.bytes.equals(fs.readFileSync(await local.path()))).toBe(true);expect(uploaded.bytes.toString()).toContain('Synthetic reviewed caption');
});
test('cached PDF HTML without the new Drive button still opens and saves locally',async({page,context})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await context.route('**/solutions/pdfsplat/',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/<button id="saveDriveButton"[^>]*>[^<]*<\/button>/,'')});});
 await page.goto('/solutions/pdfsplat/');const doc=await PDFDocument.create();doc.addPage([400,600]);await page.locator('#fileInput').setInputFiles({name:'cached.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});await expect(page.locator('#saveAsSelect')).toBeEnabled();const local=await localFile(page,'pdfsplat');expect((await PDFDocument.load(local.bytes)).getPageCount()).toBe(1);expect(errors).toEqual([]);
});
