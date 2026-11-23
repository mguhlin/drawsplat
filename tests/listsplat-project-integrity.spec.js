const {test,expect}=require('@playwright/test');

test('malformed project files preserve open work and its saved draft',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/splatworks/listsplat/');
  const cell=page.locator('input[data-record-id][data-field-id]').first();
  await cell.fill('Keep this classroom work');await cell.dispatchEvent('change');
  const saved=await page.evaluate(()=>localStorage.getItem('listsplat.autosave.v1'));
  expect(saved).toBeTruthy();
  for(const damage of ['metadata','field-options','record-values','duplicate-record']){
    const candidate=JSON.parse(saved),table=candidate.schema.tables[0];
    if(damage==='metadata')candidate.metadata=null;
    if(damage==='field-options'){table.fields[0].type='choice';table.fields[0].options={invalid:true};}
    if(damage==='record-values')table.records[0].values=[];
    if(damage==='duplicate-record')table.records[1].id=table.records[0].id;
    const warning=page.waitForEvent('dialog');
    await page.locator('[data-open-json]').setInputFiles({name:'damaged.listsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(candidate))});
    const dialog=await warning;expect(dialog.message()).toMatch(/ListSplat|project/i);await dialog.dismiss();
    expect(await page.evaluate(()=>localStorage.getItem('listsplat.autosave.v1'))).toBe(saved);
    await expect(cell).toHaveValue('Keep this classroom work');
  }
  await page.reload();await expect(cell).toHaveValue('Keep this classroom work');expect(errors).toEqual([]);
});

test('a damaged saved draft cannot prevent opening ListSplat',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('listsplat.autosave.v1',JSON.stringify({app:'ListSplatTM',version:1,schema:{tables:[{id:'broken',name:'Broken',fields:[],records:[]}],relationships:[]}})));
  await page.goto('/splatworks/listsplat/');
  await expect(page.locator('.table-tab.active')).toHaveText('Animals');
  await expect(page.locator('input[data-record-id][data-field-id]').first()).toHaveValue('Axolotl');expect(errors).toEqual([]);
});
