const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
async function ready(page){await page.goto('/splatworks/layoutsplat/');await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);page.on('dialog',d=>d.accept());}
async function reportClose(page){if(await page.locator('#importReportDialog').isVisible())await page.locator('#importReportDialog button').click();}
async function blank(page){await page.locator('#fileMenu > summary').click();await page.locator('#fileMenu [data-action=blank]').click();}
test('audio/video stay embedded through native save, reflowable EPUB, fixed EPUB and reading preview',async({page},info)=>{
 await ready(page);await blank(page);
 await page.locator('#audioInput').setInputFiles('tests/fixtures/layoutsplat/sample.mp3');
 await expect.poll(()=>page.evaluate(()=>Object.values(LayoutSplat.getPublication().assets).some(a=>a.media?.kind==='audio'))).toBe(true);await reportClose(page);
 await page.locator('#videoInput').setInputFiles('tests/fixtures/layoutsplat/sample.mp4');
 await expect.poll(()=>page.evaluate(()=>Object.values(LayoutSplat.getPublication().assets).some(a=>a.media?.kind==='video'))).toBe(true);await reportClose(page);
 const saved=page.waitForEvent('download');await page.locator('.header-actions [data-action=save]').click();const native=await fs.readFile(await(await saved).path());
 await page.locator('#projectInput').setInputFiles({name:'enhanced.layoutsplat',mimeType:'application/zip',buffer:native});
 await expect.poll(()=>page.evaluate(()=>Object.values(LayoutSplat.getPublication().assets).filter(a=>a.media).length)).toBe(2);
 const exported=await page.evaluate(async()=>{
  const d=LayoutSplat.getPublication(),{exportEpub,ebookSections}=await import('/splatworks/layoutsplat/epub-export.mjs'),{createMeasurer,layoutStories}=await import('/splatworks/layoutsplat/layout.mjs'),m=createMeasurer(),layout=layoutStories(d,m),results=[];
  for(const mode of ['reflowable','fixed']){
   const out=await exportEpub(d,layout,{epubMode:mode,ppi:72}),bytes=new Uint8Array(await out.blob.arrayBuffer()),zip=await JSZip.loadAsync(bytes),files=Object.keys(zip.files),chapter=await zip.file('EPUB/chapter-1.xhtml').async('string'),xml=new DOMParser().parseFromString(chapter,'application/xhtml+xml'),opf=new DOMParser().parseFromString(await zip.file('EPUB/package.opf').async('string'),'application/xml');
   results.push({mode,bytes:[...bytes],parseError:!!xml.querySelector('parsererror'),audio:xml.querySelectorAll('audio[controls]').length,video:xml.querySelectorAll('video[controls][poster]').length,sources:[...xml.querySelectorAll('audio,video')].map(n=>({src:n.getAttribute('src'),packaged:!!zip.file('EPUB/'+n.getAttribute('src')),style:n.getAttribute('style')})),types:[...opf.querySelectorAll('item')].map(n=>n.getAttribute('media-type')),remote:!!xml.querySelector('[src^="http"],[src^="data:"]'),files});
  }
  m.remove();return {results,reading:ebookSections(d)[0].body};
 });
 expect(exported.reading).toContain('<audio');expect(exported.reading).toContain('<video');
 for(const proof of exported.results){expect(proof.parseError).toBe(false);expect(proof.audio).toBe(1);expect(proof.video).toBe(1);expect(proof.remote).toBe(false);expect(proof.sources.every(s=>s.packaged)).toBe(true);expect(proof.types).toContain('audio/mpeg');expect(proof.types).toContain('video/mp4');if(proof.mode==='fixed')expect(proof.sources.every(s=>s.style.includes('left:'))).toBe(true);await fs.writeFile(info.outputPath(proof.mode==='fixed'?'fixed.epub':'reflowable.epub'),Buffer.from(proof.bytes));}
 await page.locator('#fileMenu > summary').click();await page.locator('#fileMenu [data-action=ebookTools]').click();await expect(page.frameLocator('#ebookPreview').locator('audio[controls]')).toHaveCount(1);await expect(page.frameLocator('#ebookPreview').locator('video[controls]')).toHaveCount(1);
});
test('source-book sanitization retains only local media, previews it safely, and exports playable resources',async({page},info)=>{
 await ready(page);const audio=await fs.readFile('tests/fixtures/layoutsplat/sample.mp3'),video=await fs.readFile('tests/fixtures/layoutsplat/sample.mp4');
 const result=await page.evaluate(async({audio,video})=>{
  const {newPublication}=await import('/splatworks/layoutsplat/engine.mjs'),{sanitizeBook,sourcePreview,exportSourceBook}=await import('/splatworks/layoutsplat/ebook-source.mjs');
  const xhtml='<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Enhanced source</title></head><body><h1>Listen and watch</h1><audio controls="controls" autoplay="autoplay" src="voice.mp3"><p>Audio description.</p></audio><video controls="controls" src="scene.mp4" onplay="alert(1)"><p>Video description.</p></video><audio src="https://example.com/blocked.mp3"/><script>alert(1)</script></body></html>';
  const d=newPublication(true);d.title='Enhanced source';d.ebookSource=sanitizeBook({version:1,chapters:[{path:'chapter.xhtml',title:'Listen and watch',xhtml}],styles:[],resources:[{path:'voice.mp3',type:'audio/mpeg',data:audio},{path:'scene.mp4',type:'video/mp4',data:video}]});
  const preview=sourcePreview(d.ebookSource,0),out=await exportSourceBook(d),bytes=new Uint8Array(await out.blob.arrayBuffer()),zip=await JSZip.loadAsync(bytes),chapter=await zip.file('chapter.xhtml').async('string');
  return {preview,chapter,bytes:[...bytes],audio:!!zip.file('voice.mp3'),video:!!zip.file('scene.mp4')};
 },{audio:audio.toString('base64'),video:video.toString('base64')});
 expect(result.chapter).toContain('src="voice.mp3"');expect(result.chapter).not.toMatch(/autoplay|onplay|<script|https:\/\/example.com/);expect(result.preview).toContain('data:audio/mpeg;base64,');expect(result.preview).toContain('media-src data:');expect(result.audio&&result.video).toBe(true);await fs.writeFile(info.outputPath('source.epub'),Buffer.from(result.bytes));
});
test('comics and reusable panels open as editable templates; body columns contain lorem ipsum',async({page},info)=>{
 await ready(page);await page.locator('#fileMenu > summary').click();await page.locator('#fileTemplates > summary').click();await page.locator('#fileMenu [data-action=comicTemplates]').click();await expect(page.locator('#libraryGrid .library-card')).toHaveCount(19);await page.locator('[data-catalog-id=comic-missing-color]').click();
 await expect.poll(()=>page.evaluate(()=>LayoutSplat.getPublication().templateId)).toBe('comic-missing-color');const d=await page.evaluate(()=>LayoutSplat.getPublication());expect(d.pages).toHaveLength(2);expect(Object.values(d.assets).every(a=>a.src.startsWith('data:image/png'))).toBe(true);expect(Object.values(d.stories).some(s=>s.text.includes('Pip:'))).toBe(true);await page.screenshot({path:info.outputPath('original-comic.png'),fullPage:true});
 const proof=await page.evaluate(async()=>{const {catalogPublication,TEMPLATE_CATALOG}=await import('/splatworks/layoutsplat/template-catalog.mjs'),{createMeasurer,layoutStories}=await import('/splatworks/layoutsplat/layout.mjs'),m=createMeasurer(),failures=[];for(const e of TEMPLATE_CATALOG.filter(e=>e.type==='comic')){const doc=catalogPublication(e.id),l=layoutStories(doc,m);if(l.overflows.length)failures.push({id:e.id,overflow:l.overflows});}const brochure=catalogPublication('brochure-1'),text=Object.values(brochure.stories).map(s=>s.text).join('\n');m.remove();return {failures,text};});expect(proof.failures).toEqual([]);expect(proof.text).toContain('Lorem ipsum');
});
test('welcome uses the LayoutSplat mark and no product surface links to the roadmap',async({page},info)=>{
 await ready(page);await page.locator('[data-action=help]').click();await expect(page.locator('#helpDialog .welcome-logo')).toBeVisible();await expect(page.locator('#helpDialog')).not.toContainText('Development roadmap');await expect(page.locator('a[href="IMPLEMENTATION_PLAN.md"]')).toHaveCount(0);await page.screenshot({path:info.outputPath('welcome-brand.png'),fullPage:true});
});
