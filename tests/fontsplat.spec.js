const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
async function ready(page){await page.goto('/solutions/fontsplat/');await expect.poll(()=>page.locator('#artwork').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
test('sixteen styles export real transparent PNG, portable SVG and editable project without remote requests',async({page},info)=>{
 const external=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});await ready(page);await expect(page.locator('.preset')).toHaveCount(16);await page.locator('#text').fill('Hello & <world>');await page.locator('[data-preset=chrome]').click();await page.locator('#curve').fill('40');await page.locator('#curve').dispatchEvent('input');await page.waitForTimeout(250);
 for(const [button,extension] of [['svg','.svg'],['png','.png'],['saveProject','.fontsplat.json']]){
  if(button==='saveProject')await page.locator('summary').filter({hasText:'Your own font'}).click();
  const pending=page.waitForEvent('download');await page.locator('#'+button).click();const download=await pending,bytes=await fs.readFile(await download.path());expect(download.suggestedFilename()).toContain(extension);await fs.writeFile(info.outputPath('wordart'+extension),bytes);
  if(extension==='.svg'){const svg=bytes.toString();expect(svg).toContain('&lt;world&gt;');expect(svg).toContain('data:font/');expect(svg).toContain('<textPath');expect(svg).not.toContain('<script');}
  if(extension==='.png'){const proof=await page.evaluate(async values=>{const b=await createImageBitmap(new Blob([new Uint8Array(values)],{type:'image/png'})),c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d');x.drawImage(b,0,0);b.close();const data=x.getImageData(0,0,c.width,c.height).data;let visible=0,transparent=0;for(let i=3;i<data.length;i+=4){if(data[i]>0)visible++;else transparent++;}return {width:c.width,height:c.height,visible,transparent};},[...bytes]);expect(proof.width).toBeGreaterThan(100);expect(proof.visible).toBeGreaterThan(500);expect(proof.transparent).toBeGreaterThan(500);}
 }
 await page.screenshot({path:info.outputPath('fontsplat-studio.png'),fullPage:true});expect(external).toEqual([]);
});
test('Unicode glitch controls preserve the original letters and custom-font projects reopen',async({page})=>{
 await ready(page);await page.locator('#text').fill('Ada');await page.locator('#above').fill('4');await page.locator('#above').dispatchEvent('input');await page.waitForTimeout(150);const output=await page.locator('#glitchOutput').inputValue();expect(output.replace(/\p{Mark}/gu,'')).toBe('Ada');expect(output.length).toBeGreaterThan(10);
 await page.locator('summary').filter({hasText:'Your own font'}).click();await page.locator('#fontFile').setInputFiles('splatworks/layoutsplat/fonts/LiberationSans-Bold.ttf');await expect(page.locator('#status')).toContainText('local font is ready');const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const bytes=await fs.readFile(await(await pending).path());await page.locator('#text').fill('Changed');await page.locator('#projectFile').setInputFiles({name:'letters.fontsplat.json',mimeType:'application/json',buffer:bytes});await expect(page.locator('#text')).toHaveValue('Ada');await expect(page.locator('#font')).toHaveValue('custom');
 const before=await page.locator('#text').inputValue();await page.locator('#projectFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'FontSplat',version:1,text:'Bad',font:'custom',fontData:'data:text/html;base64,PHNjcmlwdD4='}))});await expect(page.locator('#status')).toContainText('Embedded fonts');expect(await page.locator('#text').inputValue()).toBe(before);
});
for(const app of ['layoutsplat','writesplat','imagesplat'])test(`${app} inserts FontSplat artwork through the shared editor and ignores forged parent messages`,async({page},info)=>{
 const url=app==='imagesplat'?'/solutions/imagesplat/':'/splatworks/'+app+'/';await page.goto(url);page.on('dialog',d=>d.accept());
 if(app==='layoutsplat'){await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);await page.locator('[data-action=fontsplat]').click();}
 if(app==='writesplat'){await expect(page.locator('.ProseMirror')).toBeVisible();await page.locator('.menu-bar > .menu > summary').filter({hasText:/^Insert$/}).click();await page.locator('[data-action=fontsplat]').click();}
 if(app==='imagesplat'){await page.getByRole('button',{name:'Insert',exact:true}).click();await page.locator('[data-action=fontsplat]').click();}
 await expect(page.locator('#fontsplatEditorDialog')).toBeVisible();const frame=page.frameLocator('#fontsplatEditorDialog iframe');await expect.poll(()=>frame.locator('#artwork').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await page.evaluate(()=>{const id=new URL(document.querySelector('#fontsplatEditorDialog iframe').src).searchParams.get('request');window.postMessage({type:'fontsplat-result',source:'FontSplat',requestId:id,dataUrl:'data:image/png;base64,aGVsbG8=',width:1,height:1},location.origin);});await expect(page.locator('#fontsplatEditorDialog')).toBeVisible();
 await frame.locator('#text').fill('Original word art');await frame.locator('[data-preset=neon]').click();await frame.locator('#insert').click();await expect(page.locator('#fontsplatEditorDialog')).toHaveCount(0);
 if(app==='layoutsplat')expect(await page.evaluate(()=>Object.values(LayoutSplat.getPublication().assets).some(a=>a.alt==='Original word art'&&a.src.startsWith('data:image/png;')))).toBe(true);
 if(app==='writesplat')await expect(page.locator('.ProseMirror img[alt="Original word art"]')).toHaveCount(1);
 if(app==='imagesplat')await expect(page.locator('#layerList .layer .name')).toContainText(['FontSplat.png']);
 await page.screenshot({path:info.outputPath(app+'-wordart.png'),fullPage:true});
});
test('phone layout has no horizontal page overflow',async({page})=>{await page.setViewportSize({width:390,height:844});await ready(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
