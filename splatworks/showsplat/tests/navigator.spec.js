const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');
const url='/splatworks/showsplat/';
const text=(id,value)=>({id,type:'text',text:value,x:100,y:100,w:600,h:200,fontSize:30});
const fixture={version:1,title:'Navigator test',theme:'violet',footer:'Test footer',slides:[
 {id:'s1',title:'Welcome',notes:'Open with the audience question',collapsed:true,elements:[text('t1','Learning together')]},
 {id:'s2',title:'Café planning',indent:1,hidden:true,notes:'Remember the rehearsal prompt',elements:[text('t2','Accessibility matters'),{id:'table',type:'table',x:100,y:350,w:600,h:200,rows:[['Topic','Owner'],['Budget','María']]}]},
 {id:'s3',title:'Research',notes:'Ask about evidence',elements:[{id:'html',type:'html',x:100,y:100,w:800,h:400,html:'<h2>River habitats</h2><p>Water quality</p>'}]},
 {id:'s4',title:'Closing',notes:'',elements:[text('t4','Next steps')]},
]};
async function open(page, deck=fixture){
 await page.addInitScript(deck=>localStorage.setItem('showsplat.deck.v1',JSON.stringify(deck)),deck);
 await page.goto(url+'?lang=en');
 await expect(page.locator('#slideCanvas')).toBeVisible();
}
async function find(page){await page.locator('.slide-rail [data-action="find-slides"]').click();return page.locator('#slideSearchDialog')}
async function saved(page){const pending=page.waitForEvent('download');await page.locator('.quick-actions [data-action="save-deck"]').click();return JSON.parse(await readFile(await (await pending).path(),'utf8'))}
test('searches titles, tables, imported HTML and speaker notes with matching scopes',async({page})=>{
 await open(page);await find(page);
 const input=page.getByLabel('Search slides',{exact:true}),scope=page.getByLabel('Search in',{exact:true});
 await expect(page.locator('#slideSearchCount')).toHaveText('4 of 4 slides');
 await input.fill('CAFE');await expect(page.locator('.slide-search-result')).toHaveCount(1);
 await expect(page.locator('.slide-search-result')).toContainText('Café planning');
 await input.fill('budget maria');await expect(page.locator('.slide-search-result')).toHaveCount(1);
 await scope.selectOption('title');await expect(page.locator('.slide-search-result')).toHaveCount(0);
 await expect(page.locator('#slideSearchEmpty')).toBeVisible();
 await scope.selectOption('content');await expect(page.locator('.slide-search-result')).toHaveCount(1);
 await input.fill('water quality');await expect(page.locator('.slide-search-result')).toContainText('Research');
 await scope.selectOption('notes');await expect(page.locator('.slide-search-result')).toHaveCount(0);
 await input.fill('rehearsal');await expect(page.locator('.slide-search-result')).toContainText('Café planning');
});
test('jumps to hidden collapsed children without changing saved slides or undo history',async({page})=>{
 await open(page);const before=await saved(page);
 await page.keyboard.press('Control+Shift+F');
 await page.getByLabel('Search slides',{exact:true}).fill('cafe');
 await expect(page.locator('.slide-search-result')).toContainText('Hidden from presentation');
 await expect(page.locator('.slide-search-result')).toContainText('Inside collapsed group');
 await page.getByLabel('Search slides',{exact:true}).press('Enter');
 await expect(page.locator('#slideSearchDialog')).not.toBeVisible();
 await expect(page.locator('#speakerNotes')).toHaveValue('Remember the rehearsal prompt');
 await expect(page.locator('#slideCanvas')).toContainText('Accessibility matters');
 expect(await saved(page)).toEqual(before);
 await expect(page.locator('[data-action="undo"]').first()).toBeDisabled();
});
test('dialog typing, button shortcuts, Escape and empty-result Enter preserve the deck',async({page})=>{
 await open(page);const before=await saved(page);await find(page);
 const input=page.getByLabel('Search slides',{exact:true});
 await input.fill('does not exist');await input.press('Enter');await expect(page.locator('#slideSearchDialog')).toBeVisible();
 await input.fill('');await page.locator('.slide-search-result').first().focus();
 await page.keyboard.press('n');await page.keyboard.press('d');await page.keyboard.press('Delete');
 await expect(page.locator('#slideSearchCount')).toHaveText('4 of 4 slides');
 await page.keyboard.press('Control+z');
 await page.keyboard.press('Escape');await expect(page.locator('#slideSearchDialog')).not.toBeVisible();
 expect(await saved(page)).toEqual(before);
});
test('search parsing stays inert and results treat malicious titles as text',async({page})=>{
 await open(page,{...fixture,slides:[...fixture.slides,{id:'unsafe',title:'<img src=x onerror=window.searchRan=true>',elements:[]}]});
 await find(page);await page.getByLabel('Search slides',{exact:true}).fill('onerror');
 await expect(page.locator('.slide-search-result strong')).toHaveText('<img src=x onerror=window.searchRan=true>');
 await expect(page.locator('#slideSearchResults img')).toHaveCount(0);
 const requests=[];page.on('request',request=>{if(request.url().includes('search-parser-test'))requests.push(request.url())});
 const result=await page.evaluate(()=>{
  const input=[{title:'<img src=x onerror="window.searchRan=true">',notes:'',elements:[{type:'html',html:'<script>window.searchRan=true</script><style>secretcss</style><img src="/search-parser-test.png" onerror="window.searchRan=true"><p>Useful</p><p>content</p>'}]}];
  const index=window.ShowSplatSearch.indexSlides(input);
  return {text:index[0].content,matched:window.ShowSplatSearch.findSlides(index,'useful content','content').length,script:window.ShowSplatSearch.findSlides(index,'searchRan','content').length,ran:!!window.searchRan};
 });
 expect(result).toEqual({text:'Useful content',matched:1,script:0,ran:false});expect(requests).toEqual([]);
});
test('fresh edits are indexed each time and ordinary add/undo/redo still work',async({page})=>{
 await open(page);await page.keyboard.press('n');
 await expect.poll(async()=>JSON.parse(await page.evaluate(()=>localStorage.getItem('showsplat.deck.v1'))).slides.length).toBe(5);
 await page.keyboard.press('Control+z');await expect(page.locator('#thumbnailList .thumb')).toHaveCount(3);
 await page.keyboard.press('Control+y');await find(page);
 await expect(page.locator('#slideSearchCount')).toHaveText('5 of 5 slides');
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.locator('summary').filter({hasText:/^View$/}).click();
 await page.locator('[data-action="view-notes"]').click();
 await page.locator('#speakerNotes').fill('Freshly edited speaker note');
 await find(page);await page.getByLabel('Search slides',{exact:true}).fill('freshly edited');
 await expect(page.locator('.slide-search-result')).toHaveCount(1);
});
test('navigator fits a phone and opens a result using touch',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await find(page);
 await page.getByLabel('Search slides',{exact:true}).fill('research');
 const bounds=await page.locator('#slideSearchDialog').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);
 await page.screenshot({path:`/tmp/showsplat-navigator-${test.info().project.name}.png`});
 if(test.info().project.use.hasTouch)await page.locator('.slide-search-result').tap();else await page.locator('.slide-search-result').click();
 await expect(page.locator('#slideCanvas')).toContainText('River habitats');
});
test('JSON files reopen with searchable notes and unchanged slide content',async({page})=>{
 await open(page);const before=await saved(page);
 await page.locator('#deckFileInput').setInputFiles({name:'roundtrip.showsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(before))});
 await expect(page.locator('#statusText')).toContainText('Opened ShowSplat deck');
 await find(page);await page.getByLabel('Search slides',{exact:true}).fill('evidence');
 await expect(page.locator('.slide-search-result')).toContainText('Research');
 await page.getByRole('button',{name:'Done',exact:true}).click();expect(await saved(page)).toEqual(before);
});
test('WebDeck export preserves notes and hides skipped slides after navigator use',async({page})=>{
 await open(page);await find(page);await page.getByLabel('Search slides',{exact:true}).fill('closing');await page.locator('.slide-search-result').click();
 page.on('dialog',dialog=>dialog.accept(''));
 await page.locator('summary').filter({hasText:/^File$/}).click();
 await page.locator('.submenu summary').filter({hasText:/^Export$/}).click();
 const pending=page.waitForEvent('download');await page.locator('[data-action="export-webdeck"]').first().click();
 const html=await readFile(await (await pending).path(),'utf8');
 expect(html).not.toContain('Café planning');expect(html).toContain('Ask about evidence');expect(html).not.toContain('slideSearchDialog');
 await page.route('**/__showsplat-export.html',route=>route.fulfill({contentType:'text/html',body:html}));
 await page.goto('/__showsplat-export.html');
 await expect(page.locator('.deck > section.slide')).toHaveCount(3);
 await expect(page.locator('#counter')).toHaveText('1 / 3');
 await page.getByRole('button',{name:'Next slide',exact:true}).click();await expect(page.locator('#counter')).toHaveText('2 / 3');
 await page.getByRole('button',{name:'Toggle presenter notes here (S)',exact:true}).click();
 await expect(page.locator('#notesPanel')).toContainText('Ask about evidence');
});
test('presentation opens with standard controls after navigation',async({page})=>{
 await open(page);await find(page);await page.getByLabel('Search slides',{exact:true}).fill('closing');await page.locator('.slide-search-result').click();
 const pending=page.waitForEvent('popup');await page.locator('.quick-actions [data-action="present-first"]').click();
 const audience=await pending;
 await expect(audience.locator('#counter')).toHaveText('1 / 3');
 await audience.getByRole('button',{name:'Next slide',exact:true}).click();await expect(audience.locator('#counter')).toHaveText('2 / 3');
 await audience.close();
});
