const {test,expect}=require('@playwright/test');
test('100-page linked story prints every fragment once with physical page geometry',async({page},info)=>{
 test.setTimeout(90000);page.on('dialog',dialog=>dialog.accept());await page.goto('/splatworks/layoutsplat/');await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);
 const publication=await page.evaluate(async()=>{
  const {newPublication,frame,textStyle}=await import('/splatworks/layoutsplat/engine.mjs');const doc=newPublication(true);doc.title='100-page print conservation proof';doc.pages=[];
  const frames=[],text=[];for(let i=1;i<=100;i++){const f=frame('linked-proof',54,72,504,20);f.padding=0;frames.push(f.id);doc.pages.push({id:`page-${i}`,objects:[f]});text.push(`LAYOUTPAGE${String(i).padStart(3,'0')} Complete linked-story print text.`);}
  doc.stories={'linked-proof':{text:text.join('\n'),style:{...textStyle(),lineHeight:1.2},frames,marks:[]}};return doc;
 });
 await page.locator('#projectInput').setInputFiles({name:'large-proof.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(publication))});
 await expect.poll(()=>page.evaluate(()=>LayoutSplat.getPublication().pages.length)).toBe(100);const layout=await page.evaluate(()=>LayoutSplat.getLayout());expect(layout.overflows).toEqual([]);expect(layout.fragments.map(([,f])=>f.text).join('')).toBe(publication.stories['linked-proof'].text);
 for(let i=0;i<100;i++)expect(layout.fragments[i][1].text).toContain(`LAYOUTPAGE${String(i+1).padStart(3,'0')}`);
 await page.emulateMedia({media:'print'});await expect(page.locator('#printPages .publication-page')).toHaveCount(100);
 await page.pdf({path:info.outputPath('layoutsplat-100-page-proof.pdf'),preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
});
