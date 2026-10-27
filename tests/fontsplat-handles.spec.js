const {test,expect}=require('@playwright/test');const fs=require('node:fs/promises');
async function save(page){if(!await page.locator('#saveProject').isVisible())await page.getByText('Your own font & project',{exact:true}).click();const dl=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await fs.readFile(await(await dl).path(),'utf8'));}
async function drag(page,locator,dx,dy){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+dx,b.y+b.height/2+dy,{steps:5});await page.mouse.up();await page.waitForTimeout(150);}
test('independent text and picture handles move, resize, rotate and survive project save',async({page},info)=>{
 await page.goto('/solutions/fontsplat/');await expect(page.locator('#dimensions')).toContainText('×');await page.locator('#text').fill('Move me');await page.locator('#autoCutout').uncheck();await page.locator('#imageFile').setInputFiles('tests/fixtures/layoutsplat/sample.png');await expect(page.locator('#layerSelect option')).toHaveCount(2);const id=await page.locator('#imageSelect').inputValue();await page.locator('#layerSelect').selectOption('image:'+id);await drag(page,page.locator('.fs-selection .fs-resize.se'),45,35);expect(Number(await page.locator('#imageWidth').inputValue())).toBeGreaterThan(50);await drag(page,page.locator('.fs-selection .fs-rotate'),50,50);expect(Math.abs(Number(await page.locator('#imageRotation').inputValue()))).toBeGreaterThan(5);
 await page.locator('#layerSelect').selectOption('text-main');await drag(page,page.locator('.fs-layer-hit[data-layer="text-main"]'),20,15);await drag(page,page.locator('.fs-selection .fs-resize.se'),25,20);await drag(page,page.locator('.fs-selection .fs-rotate'),45,45);const p=await save(page);expect(p.textTransforms.main.x).toBeGreaterThan(0);expect(p.textTransforms.main.y).toBeGreaterThan(0);expect(p.textTransforms.main.scale).toBeGreaterThan(1);expect(Math.abs(p.textTransforms.main.rotation)).toBeGreaterThan(5);expect(p.images[0].width).toBeGreaterThan(50);
 await page.locator('#reset').click();await page.locator('#projectFile').setInputFiles({name:'handles.fontsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.locator('#status')).toHaveText('Project opened.');await page.locator('#layerSelect').selectOption('text-main');await expect(page.locator('.fs-selection .fs-rotate')).toBeVisible();const svgDl=page.waitForEvent('download');await page.locator('#svg').click();const svg=await fs.readFile(await(await svgDl).path(),'utf8');expect(svg).not.toContain('fs-selection');expect(svg).toContain('data-layer="text-main"');await page.screenshot({path:info.outputPath('editable-handles.png'),fullPage:true});
});

test('selection overlay stays transparent and positioned with an older stylesheet cached',async({page})=>{
 // Simulate a returning browser whose unversioned stylesheet predates handles.
 await page.route('**/fontsplat.css',route=>route.fulfill({contentType:'text/css',body:'button{background:#f2eaff;border:1px solid purple}'}));
 await page.goto('/solutions/fontsplat/');
 await expect(page.locator('.fs-selection')).toBeVisible();
 const hit=page.locator('.fs-layer-hit[data-layer="text-main"]');
 await hit.focus();await hit.hover();
 const styles=await hit.evaluate(e=>{const s=getComputedStyle(e);return {position:s.position,background:s.backgroundColor}});
 expect(styles.position).toBe('absolute');expect(styles.background).toBe('rgba(0, 0, 0, 0)');
 const handle=page.locator('.fs-selection .fs-resize.se');
 await expect(handle).toBeVisible();expect(await handle.evaluate(e=>getComputedStyle(e).position)).toBe('absolute');
 await expect(page.locator('link[href^="fontsplat.css?"]')).toHaveCount(1);
});

test('enlarging arched lettering expands the preview and exported PNG instead of clipping',async({page})=>{
 await page.goto('/solutions/fontsplat/');await page.locator('[data-text-path="arch-up"]').click();await expect(page.locator('.fs-selection')).toBeVisible();
 const dimensions=()=>page.locator('#dimensions').innerText();const before=await dimensions();
 await drag(page,page.locator('.fs-selection .fs-resize.se'),260,180);
 await expect.poll(dimensions).not.toBe(before);
 const p=await save(page);expect(p.textTransforms.main.scale).toBeGreaterThan(1.3);
 const download=page.waitForEvent('download');await page.locator('#png').click();const bytes=await fs.readFile(await(await download).path());
 const proof=await page.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let edge=0,ink=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const alpha=a[(y*c.width+x)*4+3];if(alpha>20){ink++;if(x<2||y<2||x>=c.width-2||y>=c.height-2)edge++;}}return {edge,ink,width:c.width,height:c.height};},bytes.toString('base64'));
 expect(proof.ink).toBeGreaterThan(1000);expect(proof.edge).toBe(0);
});
