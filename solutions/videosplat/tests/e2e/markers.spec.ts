import {test,expect,type Page} from '@playwright/test';
async function saved(page:Page){
 const pending=page.waitForEvent('download');await page.keyboard.press('Control+s');
 const stream=await(await pending).createReadStream();const chunks:Buffer[]=[];
 for await(const chunk of stream!)chunks.push(Buffer.from(chunk));return JSON.parse(Buffer.concat(chunks).toString());
}
const original={schema:'videosplat-project',version:2,id:'marker-test',name:'Marker test',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z',
 canvas:{width:160,height:90,frameRate:30,background:'#000000'},assets:[],
 tracks:[{id:'track',name:'Video 1',kind:'text',hidden:false,locked:false,muted:false,clips:[{id:'clip',name:'Title',kind:'text',start:0,duration:5,sourceStart:0,properties:{text:'Original title',fontSize:18}}]}],settings:{proxyMode:'auto',localOnly:true}};
async function load(page:Page,project=original){
 await page.locator('input[accept=".json,.videosplat.json,application/json"]').setInputFiles({name:'markers.videosplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
 await expect(page.locator('.timeline-clip')).toHaveCount(1);
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>sessionStorage.setItem('videosplat-splash-seen','1'));await page.goto('./');});
test('old projects gain editable markers without changing clips, then save and reopen',async({page})=>{
 await load(page);await expect(page.getByRole('button',{name:'Markers (0)',exact:true})).toBeVisible();
 await page.locator('.ruler').click({position:{x:83,y:25}});await page.keyboard.press('m');
 await expect(page.locator('.timeline-marker')).toHaveCount(1);
 await page.getByRole('button',{name:'Markers (1)',exact:true}).click();
 await page.getByLabel('Marker name',{exact:true}).fill('Scene change');
 await page.getByLabel('Marker time',{exact:true}).fill('2.5');await page.getByLabel('Marker color',{exact:true}).selectOption('#3ddc97');
 await page.getByRole('button',{name:'Save marker',exact:true}).click();await expect(page.getByRole('dialog').getByLabel('Go to marker Scene change')).toBeVisible();
 await page.screenshot({path:'/tmp/videosplat-markers-desktop.png'});
 await page.getByRole('button',{name:'Close',exact:true}).click();
 const project=await saved(page);expect(project.tracks).toEqual(original.tracks);expect(project.version).toBe(2);
 expect(project.markers).toEqual([expect.objectContaining({name:'Scene change',time:2.5,color:'#3ddc97'})]);
 await load(page,project);await expect(page.locator('.timeline-marker')).toHaveCount(1);
 await page.getByRole('button',{name:'Markers (1)',exact:true}).click();
 await page.getByRole('button',{name:'Delete marker Scene change',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).click();
 await expect(page.locator('.timeline-marker')).toHaveCount(0);await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(page.locator('.timeline-marker')).toHaveCount(1);await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('.timeline-marker')).toHaveCount(0);
});
test('marker navigation, typing, and timeline zoom keep bookmarks separate from edit actions',async({page})=>{
 await load(page);await page.locator('.ruler').click({position:{x:41.5,y:25}});await page.getByRole('button',{name:'Add marker',exact:true}).click();
 await page.locator('.ruler').click({position:{x:167,y:25}});await page.keyboard.press('m');
 await page.getByRole('button',{name:'Previous marker',exact:true}).click();
 await expect(page.locator('.transport output')).toHaveText('00:00:01:00');
 await page.getByRole('button',{name:'Next marker',exact:true}).click();await expect(page.locator('.transport output')).toHaveText('00:00:04:00');
 await page.getByRole('button',{name:'Markers (2)',exact:true}).click();
 await page.getByLabel('Marker name',{exact:true}).fill('');await page.getByLabel('Marker name',{exact:true}).press('m');
 await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('.timeline-marker')).toHaveCount(2);
 const before=await page.locator('.timeline-marker').last().evaluate(n=>parseFloat((n as HTMLElement).style.left));
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 expect(await page.locator('.timeline-marker').last().evaluate(n=>parseFloat((n as HTMLElement).style.left))).toBeGreaterThan(before);
 expect((await saved(page)).tracks).toEqual(original.tracks);
});
test('malformed markers are rejected without losing the current project',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Add marker',exact:true}).click();
 await page.locator('input[accept=".json,.videosplat.json,application/json"]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...original,markers:[{id:'bad',name:'Bad',time:-5,color:'red'}]}))});
 await expect(page.locator('.timeline-marker')).toHaveCount(1);expect((await saved(page)).tracks).toEqual(original.tracks);
});
test('marker panel fits a phone and supports tap controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);
 await page.getByRole('button',{name:'Add marker',exact:true}).click();await page.getByRole('button',{name:'Markers (1)',exact:true}).click();
 await page.getByLabel('Marker name',{exact:true}).fill('Phone bookmark');await page.getByRole('button',{name:'Save marker',exact:true}).click();
 const dialog=await page.getByRole('dialog').boundingBox();expect(dialog!.width).toBeLessThanOrEqual(390);
 await page.screenshot({path:'/tmp/videosplat-markers-phone.png'});await page.getByRole('button',{name:'Close',exact:true}).click();
 await expect(page.locator('.timeline-marker')).toHaveCount(1);
});
