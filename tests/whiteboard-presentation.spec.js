const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('drawsplat.welcomed','1');localStorage.setItem('drawsplat.consent.accepted','1');localStorage.setItem('drawsplat.lastStartupTipDate',new Date().toISOString().slice(0,10))});
  await page.goto('/app/whiteboard.html');
});
async function options(page){
  await page.locator('.top-menu > summary').filter({hasText:/^Options$/}).click();
  await page.locator('[data-menu-target="optionsBtn"]').click();
}
for(const width of [1280,390]){
  test(`Options explains choices and preserves work at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    const board={title:'Keep this board',active:0,mode:'teacher',panels:[{id:'p1',name:'Frame 1',bg:'blank',objects:[{id:'r1',type:'rect',x:80,y:80,w:100,h:80,fill:'#ff0000',stroke:'#000000',strokeWidth:2,opacity:1}]}]};
    await page.locator('#jsonInput').setInputFiles({name:'keep.drawsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(board))});
    await options(page);
    const dialog=page.locator('#optionsDialog');
    await expect(dialog.locator('.options-card')).toHaveCount(4);
    await expect(dialog.locator('.options-intro')).toBeVisible();
    await expect(page.locator('#resetBoardBtn .icon-label')).toBeVisible();
    await expect(page.locator('#resetBoardBtn')).toContainText('Reset Board');
    await page.locator('#workspaceMode').selectOption('education');
    await expect(page.locator('#workspaceStatus')).toContainText('Education Tools shows');
    await page.locator('#interfaceMode').selectOption('advanced');
    await expect(page.locator('body')).toHaveAttribute('data-view','advanced');
    await page.locator('#resetBoardBtn').click();
    await expect(page.locator('#confirmDialog')).toBeVisible();
    await page.locator('#confirmDialogCancel').click();
    await expect(dialog).toBeVisible();
    await page.locator('#closeOptions').click();
    await expect(page.locator('#boardSvg .object')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#boardSvg .object')).toHaveCount(1);
    await options(page);
    await expect(page.locator('#interfaceMode')).toHaveValue('advanced');
    await expect(page.locator('#workspaceMode')).toHaveValue('education');
    const rect=await dialog.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width);expect(rect.y+rect.height).toBeLessThanOrEqual(900);
    await page.screenshot({path:`.tmp/options-${width}.png`});
  });
}
test('static and dynamically built dialogs have guidance and readable action names',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [button,dialog] of [['openGraphDialogBtn','graphDialog'],['openEmojiDialogBtn','emojiDialog'],['openClassroomWidgetsBtn','classroomWidgetDialog'],['imageBtn','imageSourceDialog']]){
    await page.locator('#'+button).evaluate(el=>el.click());
    await expect(page.locator('#'+dialog)).toBeVisible();
    await expect(page.locator('#'+dialog+' .whiteboard-dialog-intro')).toHaveCount(1);
    for(const label of await page.locator('#'+dialog+' .icon-label').all())await expect(label).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#'+dialog)).toBeHidden();
  }
  // Reopening a rebuilt dialog must not accumulate duplicate explanations.
  await page.locator('#openClassroomWidgetsBtn').evaluate(el=>el.click());
  await expect(page.locator('#classroomWidgetDialog .whiteboard-dialog-intro')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('student links keep teacher setup and reset cards hidden',async({page})=>{
  await page.goto('/app/whiteboard.html?role=student');
  await options(page);
  await expect(page.locator('#settingsBtn')).toBeHidden();
  await expect(page.locator('#resetBoardBtn')).toBeHidden();
  await expect(page.locator('#optionsDialog .options-card.teacher-only').first()).toBeHidden();
  await expect(page.locator('#optionsDialog .options-card.teacher-only').last()).toBeHidden();
  await expect(page.locator('#workspaceMode')).toBeVisible();
});
