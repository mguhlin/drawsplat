const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('drawsplat.welcomed', '1');
    localStorage.setItem('drawsplat.consent.accepted', '1');
  });
  await page.goto('/app/whiteboard.html');
});

test('keeps tool guidance visible and exposes selection state', async ({ page }) => {
  const hud = page.locator('#canvasToolHud');
  await expect(hud).toBeVisible();
  await expect(page.locator('[data-tool="select"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#drawToolGroup > summary').click();
  await page.locator('[data-tool="pen"]').click();
  await expect(page.locator('#canvasToolName')).toHaveText('Pencil');
  await expect(page.locator('#canvasToolHelp')).toContainText('drag on the canvas');
  await expect(page.locator('#toolButtons [data-tool="pen"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-tool="select"]')).toHaveAttribute('aria-pressed', 'false');
});

test('provides keyboard navigation landmarks', async ({ page }) => {
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#boardSvg');
  await expect(page.locator('.sidebar')).toHaveAttribute('aria-label', 'Whiteboard tools');
  await expect(page.locator('.stage-wrap')).toHaveAttribute('aria-label', 'Whiteboard workspace');
  await expect(page.locator('#boardSvg')).toHaveAttribute('tabindex', '0');
});

for (const width of [1280, 390]) {
  test(`toolbar menus explain their tools and remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const group of ['drawToolGroup','shapeToolGroup','textToolGroup','insertToolGroup','backgroundToolGroup','moreToolGroup']) {
      await page.locator(`#${group} > summary`).click();
      const menu = page.locator(`#${group} .tool-popover-panel`);
      await expect(menu).toBeVisible();
      const actions = menu.locator('.toolbar-action');
      const count = await actions.count();
      await expect(menu.locator('.toolbar-action-description')).toHaveCount(count);
      const bounds = await menu.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
      for (const action of await actions.filter({ visible: true }).all()) {
        await action.scrollIntoViewIfNeeded();
        await expect(action.locator('.icon-label')).toBeVisible();
        await expect(action.locator('.toolbar-action-description')).not.toHaveText('');
        expect(await action.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        })).toBe(true);
      }
      await page.locator(`#${group} > summary`).click();
      await expect(menu).toBeHidden();
    }
    await page.locator('#insertToolGroup > summary').click();
    const insert = page.locator('#insertToolGroup .tool-popover-panel');
    await expect(insert.locator('button')).toHaveCount(5);
    await expect(insert.locator('.icon-label')).toHaveText(['Add Image','Coloring Book','Graph Creator','Picture Graph','Classroom Widgets']);
    await page.locator('#simpleGraphBtn').click();
    await expect(insert).toBeHidden();
    await expect(page.locator('#graphDialog')).toBeVisible();
    await page.locator('#graphCancelBtn').click();
    await page.locator('#drawToolGroup > summary').click();
    await page.locator('#toolButtons [data-tool="eraser"]').click();
    await expect(page.locator('#eraserSizeControls')).toBeVisible();
    await page.locator('[data-eraser-width]').first().click();
    await expect(page.locator('#eraserSizeControls')).toBeVisible();
  });
}

for (const width of [1280,390]) {
  test(`application menus explain actions and dismiss outside at ${width}px`,async ({page})=>{
    await page.setViewportSize({width,height:900});
    for(const title of ['File','Edit','Insert','Tools','Options']){
      const group=page.locator('.top-menu').filter({has:page.locator('summary',{hasText:new RegExp('^'+title+'$')})});
      await group.locator('summary').click();
      const menu=group.locator('.top-menu-list');
      await expect(menu).toBeVisible();
      const actions=menu.locator('.top-menu-action').filter({visible:true});
      for(const action of await actions.all()){
        await action.scrollIntoViewIfNeeded();
        await expect(action.locator('.icon-label')).toBeVisible();
        await expect(action.locator('.menu-action-description')).not.toHaveText('');
      }
      const bounds=await menu.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y+bounds.height).toBeLessThanOrEqual(900);
      await page.mouse.click(width-4,895);
      await expect(menu).toBeHidden();
    }
    await page.locator('#drawToolGroup > summary').click();
    const drawing=page.locator('#drawToolGroup .tool-popover-panel');
    await expect(drawing).toBeVisible();
    await page.locator('[data-tool-color]').first().click();
    await expect(drawing).toBeVisible();
    await page.mouse.click(width-4,895);
    await expect(drawing).toBeHidden();
    await page.locator('#drawToolGroup > summary').click();
    await page.keyboard.press('Escape');
    await expect(drawing).toBeHidden();
    const insert=page.locator('.top-menu').filter({has:page.locator('summary',{hasText:/^Insert$/})});
    await insert.locator('summary').click();
    await insert.locator('[data-menu-target="openGraphDialogBtn"]').click();
    await expect(page.locator('#graphDialog')).toBeVisible();
  });
}
