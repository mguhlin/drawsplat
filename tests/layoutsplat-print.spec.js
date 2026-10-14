const {test,expect}=require('@playwright/test');
test('100-page linked story prints every fragment once with physical page geometry',async({page},info)=>{
 test.setTimeout(90000);page.on('dialog',dialog=>dialog.accept());await page.goto('/splatworks/layoutsplat/');await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);
 const publication=await page.evaluate(async()=>{
  const {newPublication,frame,textStyle}=await import('/splatworks/layoutsplat/engine.mjs');const doc=newPublication(true);doc.title='100-page print conservation proof';doc.pages=[];
  const frames=[],text=[],bodies={};for(let i=1;i<=100;i++){const f=frame('linked-proof',54,72,504,20);f.padding=0;frames.push(f.id);const bodyId=`body-${i}`,body=frame(bodyId,54,112,504,620);body.padding=0;const marker=`BODYCOPY${String(i).padStart(3,'0')}`,paragraph=`${marker} Publication testing checks complete paragraphs, readable type and stable page geometry. Every page keeps its own body copy alongside the continuous linked story, so printing cannot drop or duplicate either.\n\n`;bodies[bodyId]={text:paragraph.repeat(8).trimEnd(),frames:[body.id],style:textStyle(),marks:[]};doc.pages.push({id:`page-${i}`,objects:[f,body]});text.push(`LAYOUTPAGE${String(i).padStart(3,'0')} Complete linked-story print text.`);}
  doc.stories={'linked-proof':{text:text.join('\n'),style:{...textStyle(),lineHeight:1.2},frames,marks:[]},...bodies};return doc;
 });
 await page.locator('#projectInput').setInputFiles({name:'large-proof.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(publication))});
 await expect.poll(()=>page.evaluate(()=>LayoutSplat.getPublication().pages.length)).toBe(100);const layout=await page.evaluate(()=>LayoutSplat.getLayout());expect(layout.overflows).toEqual([]);const fragments=new Map(layout.fragments);expect(publication.stories['linked-proof'].frames.map(id=>fragments.get(id).text).join('')).toBe(publication.stories['linked-proof'].text);for(const [id,story]of Object.entries(publication.stories))if(id!=='linked-proof')expect(fragments.get(story.frames[0]).text).toBe(story.text);
 for(let i=0;i<100;i++)expect(fragments.get(publication.stories['linked-proof'].frames[i]).text).toContain(`LAYOUTPAGE${String(i+1).padStart(3,'0')}`);
 await page.emulateMedia({media:'print'});await expect(page.locator('#printPages .publication-page')).toHaveCount(100);
 await page.pdf({path:info.outputPath('layoutsplat-100-page-proof.pdf'),preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
});
