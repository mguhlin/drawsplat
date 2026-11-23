const {test,expect}=require('@playwright/test');

test('published GridSplat preserves cleared merges and rejects unsafe sorting',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/splatworks/gridsplat/');await page.getByRole('button',{name:'New Sheet',exact:true}).click();
  const data={version:1,metadata:{title:'Merge check',createdAt:'2026-01-01T00:00:00Z'},sheets:[{id:'sheet-1',name:'Sheet 1',cells:[['Merged notes']],rows:20,cols:20,merges:[{row:0,col:0,rowSpan:2,colSpan:2}]}],charts:[],pictureGraphs:[]};
  await page.getByLabel('Import spreadsheet file').setInputFiles({name:'merge-check.gridsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  const cell=page.getByTestId('cell-A1');await expect(cell).toContainText('Merged notes');
  await cell.click();await page.keyboard.press('Delete');await expect(cell).not.toContainText('Merged notes');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gridsplat.autosave.v1')||'{}').sheets?.[0]?.merges)).toEqual(data.sheets[0].merges);
  await page.reload();await page.getByRole('button',{name:'New Sheet',exact:true}).click();
  await expect(page.getByTestId('cell-B2')).toHaveCount(0);await cell.click();
  await page.getByRole('button',{name:'Sort A to Z',exact:true}).click();await expect(page.locator('.file-message')).toContainText('Unmerge cells');
  await expect(page.getByRole('grid')).toBeVisible();expect(errors).toEqual([]);
});
