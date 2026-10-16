const {test,expect}=require('@playwright/test');const fs=require('node:fs/promises');
test('PUB downloads a native Unicode publication, decodes without its embedded project and detects external edits',async({page},testInfo)=>{
 test.setTimeout(120000);page.on('dialog',d=>d.accept());await page.goto('/splatworks/layoutsplat/');await page.waitForFunction(()=>!!window.LayoutSplat);
 const source=await page.evaluate(async()=>{
  const {newPublication,frame,shape,textStyle}=await import('/splatworks/layoutsplat/engine.mjs'),d=newPublication(true);
  const p=d.pages[0],s='pub-story',f=frame(s,36,110,400,180);f.padding=0;
  d.title='PUB export proof';d.stories[s]={text:'Editable café 中文\nSecond styled paragraph',frames:[f.id],style:{...textStyle(),size:18,color:'#123456'},marks:[{from:0,to:8,bold:true},{from:9,to:13,italic:true,underline:true}],paragraphs:[{from:0,to:16,leading:24,align:'left'},{from:17,to:40,leading:24,align:'center'}]};
  // Use actual text length for the second formatting range.
  d.stories[s].paragraphs[0].to=d.stories[s].text.indexOf('\n');d.stories[s].paragraphs[1].from=d.stories[s].text.indexOf('\n')+1;d.stories[s].paragraphs[1].to=d.stories[s].text.length;
  p.objects.push(shape(36,30,90,40,'#ff9900'),f,shape(180,40,80,45,'#00aa66','ellipse'),{id:crypto.randomUUID(),type:'table',x:36,y:350,w:300,h:80,rotation:0,locked:false,header:true,cells:[['Name','Value'],['Native PUB','42']],fontSize:12});
  d.pages.push({id:crypto.randomUUID(),objects:[shape(36,36,100,40,'#3366ff')]});return d;
 });
 await page.locator('#projectInput').setInputFiles({name:'proof.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(source))});await expect(page.locator('#publicationTitle')).toHaveValue(source.title);
 await page.locator('#fileMenu > summary').click();await page.locator('#fileExport > summary').click();await page.locator('[data-action=export-pub]').click();await expect(page.locator('#exportFormat')).toHaveValue('pub');await expect(page.locator('#exportFormatHint')).toContainText('Publisher 2000');await page.screenshot({path:testInfo.outputPath('publisher-export-dialog.png')});
 const pending=page.waitForEvent('download');await page.locator('#exportDownload').click();const download=await pending;expect(download.suggestedFilename()).toMatch(/\.pub$/);const buffer=await fs.readFile(await download.path());await fs.writeFile(testInfo.outputPath('native-export.pub'),buffer);
 expect([...buffer.subarray(0,8)]).toEqual([208,207,17,224,161,177,26,225]);
 const result=await page.evaluate(async encoded=>{
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),{CFB}=await import('/splatworks/shared/word-legacy/compound-file.mjs'),{publisherNativeProject}=await import('/splatworks/layoutsplat/publisher-binary.mjs');
  const restored=await publisherNativeProject(bytes),cfb=CFB.parse(bytes);CFB.utils.cfb_del(cfb,'LayoutSplat');const native=new Uint8Array(CFB.write(cfb));
  const decode=buffer=>new Promise((resolve,reject)=>{const w=new Worker('/splatworks/layoutsplat/publisher/worker.mjs',{type:'module'}),timer=setTimeout(()=>{w.terminate();reject(Error('timeout'));},60000);w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(e.data);};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.postMessage(buffer,[buffer]);});
  const decoded=await decode(native.buffer),{publicationFromPublisher}=await import('/splatworks/layoutsplat/publisher.mjs'),imported=await publicationFromPublisher(decoded.events);
  const edited=CFB.parse(bytes),stream=CFB.find(edited,'/Quill/QuillSub/CONTENTS');const text=new TextDecoder('utf-16le').decode(new Uint8Array(stream.content)),at=text.indexOf('Editable');if(at<0)throw Error('Text missing from Quill');stream.content[at*2]='X'.charCodeAt(0);
  const editedBytes=new Uint8Array(CFB.write(edited)),stale=await publisherNativeProject(editedBytes),{importPublisher}=await import('/splatworks/layoutsplat/publisher.mjs'),changed=await importPublisher(new File([editedBytes],'edited.pub'));const editedText=Object.values(changed.doc.stories).map(s=>s.text).join('');
  return {restored,stale,editedText,pages:decoded.events.filter(e=>e.op==='startPage').length,text:decoded.events.filter(e=>e.op==='insertText').map(e=>e.data).join(''),stories:Object.values(imported.doc.stories),shapes:imported.doc.pages.flatMap(p=>p.objects).filter(o=>o.type==='shape'),pictures:Object.keys(imported.doc.assets).length,warnings:imported.warnings};
 },buffer.toString('base64'));
 expect(result.restored).toEqual(source);expect(result.stale).toBeNull();expect(result.editedText).toContain('Xditable café 中文');expect(result.pages).toBe(2);expect(result.text).toContain('Editable café 中文');expect(result.text).toContain('Second styled paragraph');expect(result.shapes.some(o=>o.fill==='#ff9900')).toBe(true);expect(result.pictures,result.warnings.join('\n')).toBeGreaterThan(0);expect(result.stories[0].marks.some(m=>m.bold)).toBe(true);expect(result.stories[0].marks.some(m=>m.italic&&m.underline)).toBe(true);
 await page.locator('#importReportDialog button').click();await page.locator('#exportDialog [value=cancel]').last().click();await page.locator('#projectInput').setInputFiles({name:'reopen.pub',mimeType:'application/x-mspublisher',buffer});await expect.poll(()=>page.evaluate(()=>LayoutSplat.getPublication())).toEqual(source);
});
