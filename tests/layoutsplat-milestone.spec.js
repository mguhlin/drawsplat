const {test,expect}=require('@playwright/test');
async function ready(page){await page.goto('/splatworks/layoutsplat/');await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);page.on('dialog',d=>d.accept());}
async function templates(page,action){await page.locator('#fileMenu > summary').click();if(!await page.locator('#fileTemplates').evaluate(e=>e.open))await page.locator('#fileTemplates > summary').click();await page.locator(`[data-action=${action}]`).click();}
test('story dialog moves and selected formatting survives applying and undo',async({page})=>{
 await ready(page);await page.locator('#fileMenu > summary').click();await page.locator('[data-action=blank]').click();await page.locator('[data-action=text]').click();await page.locator('[data-action=editStory]').first().click();
 const editor=page.locator('#storyText');await editor.fill('Selected words');await editor.press('ControlOrMeta+a');
 for(const mark of ['strong','em','underline']){await page.locator(`[data-story-mark=${mark}]`).click();await expect(page.locator(`[data-story-mark=${mark}]`)).toHaveAttribute('aria-pressed','true');}
 await page.locator('[data-story-align=center]').click();const before=await page.locator('#storyDialog').boundingBox(),head=await page.locator('#storyDialog .dialog-head h2').boundingBox();
 await page.mouse.move(head.x+10,head.y+10);await page.mouse.down();await page.mouse.move(head.x+90,head.y+50);await page.mouse.up();const after=await page.locator('#storyDialog').boundingBox();expect(after.x-before.x).toBeCloseTo(80,0);expect(after.y-before.y).toBeCloseTo(40,0);
 await page.locator('#applyStory').click();const s=await page.evaluate(()=>Object.values(LayoutSplat.getPublication().stories)[0]);expect(s.text).toBe('Selected words');expect(s.marks[0]).toMatchObject({bold:true,italic:true,underline:true});expect(s.paragraphs[0].align).toBe('center');await page.locator('#undoBtn').click();expect(await page.evaluate(()=>Object.values(LayoutSplat.getPublication().stories)[0].text)).not.toBe(s.text);
});
test('whiteboard background embeds portable artwork, replaces only the background and supports undo',async({page})=>{
 await ready(page);const original=await page.evaluate(()=>LayoutSplat.getPublication());await templates(page,'whiteboardBackgrounds');await expect(page.locator('#backgroundGrid button')).toHaveCount(96);await page.locator('#backgroundGroup').selectOption('classroom');await page.locator('#backgroundGrid button').first().click();await expect(page.locator('#backgroundLibraryDialog')).toBeHidden();
 let d=await page.evaluate(()=>LayoutSplat.getPublication()),background=d.pages[0].objects[0];expect(background).toMatchObject({type:'image',locked:true,whiteboardBackground:true,x:0,y:0,w:d.width,h:d.height});expect(d.assets[background.assetId].src).toMatch(/^data:image\//);expect(d.pages[0].objects.slice(1)).toEqual(original.pages[0].objects);
 await templates(page,'whiteboardBackgrounds');await page.locator('#backgroundGroup').selectOption('scratch');await page.locator('#backgroundGrid button').first().click();await expect(page.locator('#backgroundLibraryDialog')).toBeHidden();d=await page.evaluate(()=>LayoutSplat.getPublication());expect(d.pages[0].objects.filter(o=>o.whiteboardBackground)).toHaveLength(1);expect(d.pages[0].objects[0].assetId).not.toBe(background.assetId);await page.locator('#undoBtn').click();expect(await page.evaluate(()=>LayoutSplat.getPublication().pages[0].objects[0])).toEqual(background);
});
test('native suite merge calculates formulas, preserves codes, and excludes archived records',async({page})=>{
 await ready(page);const result=await page.evaluate(async()=>{
 const {nativeMergeSources}=await import('/splatworks/layoutsplat/suite-data.mjs');
 const grid={version:1,sheets:[{name:'Customers',cells:[['Name','Code','Total'],['Ada','0012','=2+3']],formats:[{row:1,col:2,format:{numberFormat:'decimal',decimalPlaces:2}}]}]};
 const list={app:'ListSplatTM',version:1,schema:{tables:[{id:'t',name:'People',fields:[{id:'n',name:'Name',type:'text'},{id:'v',name:'Count',type:'number'},{id:'c',name:'Double',type:'calculation',formula:'MULTIPLY(Count, "2")'}],records:[{id:'a',values:{n:'Ada',v:3}},{id:'b',archived:true,values:{n:'Hidden',v:4}}]}]}};
 return {grid:nativeMergeSources(grid)[0].rows(),list:nativeMergeSources(list)[0].rows()};});
 expect(result.grid).toEqual([['Name','Code','Total'],['Ada','0012','5.00']]);expect(result.list).toEqual([['Name','Count','Double'],['Ada','3','6']]);
});
test('500-page layout reuses unchanged stories and reflows only the edited story',async({page})=>{
 await ready(page);const result=await page.evaluate(async()=>{
 const {newPublication,frame,textStyle}=await import('/splatworks/layoutsplat/engine.mjs'),{layoutStories,createMeasurer}=await import('/splatworks/layoutsplat/layout.mjs');const d=newPublication(true);d.pages=[];d.stories={};
 for(let i=0;i<500;i++){const id='story'+i,f=frame(id,36,36,540,700);d.pages.push({id:'page'+i,objects:[f]});d.stories[id]={text:`Page ${i+1}: complete text preserved.`,frames:[f.id],marks:[],style:textStyle()};}
 const m=createMeasurer(),start=performance.now(),first=layoutStories(d,m),initial=performance.now()-start;const cached=layoutStories(d,m);d.stories.story42.text+=' Edited.';const edited=layoutStories(d,m);m.remove();return {initial,first:first.stats,cached:cached.stats,edited:edited.stats,overflow:edited.overflows.length,text:[...edited.fragments.values()].map(f=>f.text)};});
 expect(result.first).toEqual({reflowed:500,reused:0});expect(result.cached).toEqual({reflowed:0,reused:500});expect(result.edited).toEqual({reflowed:1,reused:499});expect(result.overflow).toBe(0);expect(result.text).toHaveLength(500);expect(result.text[42]).toContain('Edited.');test.info().annotations.push({type:'initial-layout-ms',description:String(Math.round(result.initial))});
});
test('original template compositions render without missing or overflowing text',async({page})=>{
 test.setTimeout(180000);await ready(page);const report=await page.evaluate(async()=>{
 const {TEMPLATE_CATALOG,catalogPublication}=await import('/splatworks/layoutsplat/template-catalog.mjs'),{createMeasurer,layoutStories}=await import('/splatworks/layoutsplat/layout.mjs');await document.fonts.ready;const m=createMeasurer(),failures=[];
 for(const e of TEMPLATE_CATALOG)for(const language of ['en','es','vi','ar','zh','uh']){const d=catalogPublication(e.id,{language}),l=layoutStories(d,m);if(l.overflows.length)failures.push({id:e.id,language,overflows:l.overflows.map(x=>({text:d.stories[x.storyId].text,remaining:x.remaining}))});}m.remove();return failures;});expect(report).toEqual([]);
});
