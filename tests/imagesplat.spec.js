const { expect, test } = require("@playwright/test");

test("the former ImageSplat URL redirects to the canonical route", async ({
  page,
}) => {
  await page.goto("/solutions/splatimage-studio/");
  await expect(page).toHaveURL(/\/solutions\/imagesplat\/$/);
  await expect(page.getByRole("heading", { name: "ImageSplat™" })).toBeVisible();
});

test("ImageSplat copies only the imported image, preserving white image pixels", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async ([item]) => {
          const blob = await item.getType("image/png");
          const bitmap = await createImageBitmap(blob);
          window.__copiedPngSize = {
            width: bitmap.width,
            height: bitmap.height,
          };
          const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
          window.__copiedPngCorner=[...ctx.getImageData(0,0,1,1).data];
        },
      },
    });
  });
  await page.goto("/solutions/imagesplat/");

  await expect(page.getByRole("heading", { name: "ImageSplat™" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open DrawSplat apps" })).toBeVisible();

  const input = page.locator("#imageInput");
  await input.setInputFiles({
    name: "background.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      await page.evaluate(() => {const c=document.createElement('canvas');c.width=80;c.height=60;const cx=c.getContext('2d');cx.fillStyle='white';cx.fillRect(0,0,80,60);cx.fillStyle='red';cx.fillRect(20,20,40,20);return c.toDataURL().split(',')[1]}), 'base64',
    ),
  });
  await expect(page.locator('#layerList .layer')).toHaveCount(1);

  await page.getByRole("button", { name: "Copy PNG", exact: true }).first().click();
  await expect
    .poll(() => page.evaluate(() => window.__copiedPngSize))
    .not.toBeUndefined();
  const copiedSize = await page.evaluate(() => window.__copiedPngSize);
  expect(copiedSize).toEqual({width:80,height:60});
  expect(await page.evaluate(()=>window.__copiedPngCorner)).toEqual([255,255,255,255]);
});

async function capturePng(page, action='exportPng') {
  const download = page.waitForEvent('download');
  await page.locator(`[data-action="${action}"]`).first().evaluate(button=>button.click());
  const stream=await (await download).createReadStream(),chunks=[];
  for await(const chunk of stream)chunks.push(chunk);
  return page.evaluate(async base64=>{
    const img=await createImageBitmap(await (await fetch('data:image/png;base64,'+base64)).blob());
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);
    const data=[...cx.getImageData(0,0,c.width,c.height).data];return {width:c.width,height:c.height,data};
  },Buffer.concat(chunks).toString('base64'));
}

async function drawShape(page,tool,start,end){
  await page.locator(`.tool-grid [data-tool="${tool}"]`).evaluate(b=>b.click());
  const r=await page.locator('#stage').boundingBox();
  await page.mouse.move(r.x+start.x,r.y+start.y);await page.mouse.down();
  await page.mouse.move(r.x+end.x,r.y+end.y,{steps:5});await page.mouse.up();
}

test('PNG download includes complete strokes and arrowheads, with transparent gaps and no workspace',async({page})=>{
  await page.goto('/solutions/imagesplat/');
  await page.locator('#strokeWidth').evaluate(el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#arrowSize').evaluate(el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await drawShape(page,'arrow',{x:100,y:100},{x:200,y:100});
  const png=await capturePng(page);
  expect(png.width).toBe(110);expect(png.height).toBeGreaterThanOrEqual(50);expect(png.height).toBeLessThanOrEqual(51);
  expect(png.data[3]).toBe(0);
  // Both tips of the arrow head survive the crop, beyond the line's bounds.
  const rowHasInk=y=>png.data.slice(y*png.width*4,(y+1)*png.width*4).some((v,i)=>i%4===3&&v>0);
  expect([4,5,6].some(rowHasInk)).toBe(true);expect([44,45,46].some(rowHasInk)).toBe(true);
  const selected=await capturePng(page,'exportSelection');
  expect(selected).toEqual(png);
  await page.locator('#layerList .layer button').click();
  const hidden=await capturePng(page);
  expect(hidden).toEqual({width:1,height:1,data:[0,0,0,0]});
});

test('multiline italic underlined text outside an image is included in both PNG actions',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async([item])=>{const b=await item.getType('image/png');window.__copiedPng=[...new Uint8Array(await b.arrayBuffer())]}}}));
  await page.goto('/solutions/imagesplat/');
  const buffer=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=80;c.height=60;c.getContext('2d').fillRect(0,0,80,60);return c.toDataURL().split(',')[1]}),'base64');
  await page.locator('#imageInput').setInputFiles({name:'photo.png',mimeType:'image/png',buffer});
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await drawShape(page,'text',{x:200,y:180},{x:200,y:180});
  await page.locator('#textValue').fill('First line\nSecond line\nThird line');
  await page.locator('#textSizeNumber').fill('40');
  await page.locator('#textItalic').click();await page.locator('#textUnderline').click();
  await page.locator('#textInsert').click();
  const png=await capturePng(page);
  expect(png.width).toBeGreaterThan(300);expect(png.width).toBeLessThan(400);
  expect(png.height).toBeGreaterThan(275);expect(png.height).toBeLessThan(285);
  expect(png.data.slice(0,4)).toEqual([0,0,0,255]); // Image's original top-left.
  expect(png.data[(100*png.width+100)*4+3]).toBe(0); // Gap between objects.
  expect(png.data.slice(-png.width*4).some((v,i)=>i%4===3&&v>0)).toBe(true); // Final underline.
  await page.locator('[data-action="copyPng"]').first().evaluate(b=>b.click());
  await expect.poll(()=>page.evaluate(()=>window.__copiedPng?.length||0)).toBeGreaterThan(0);
  const copied=Buffer.from(await page.evaluate(()=>window.__copiedPng));
  const download=page.waitForEvent('download');await page.locator('[data-action="exportPng"]').first().evaluate(b=>b.click());
  const stream=await(await download).createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
  expect(copied.equals(Buffer.concat(chunks))).toBe(true);
});

test('reverse-drawn shapes export outside the canvas and cropping retains canvas coordinates',async({page})=>{
  await page.goto('/solutions/imagesplat/');
  await page.locator('#strokeWidth').evaluate(el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await drawShape(page,'rect',{x:100,y:100},{x:-20,y:-30});
  const png=await capturePng(page);expect(png.width).toBe(130);expect(png.height).toBeGreaterThanOrEqual(140);expect(png.height).toBeLessThanOrEqual(141);
  expect(png.data.slice(0,4)).not.toEqual([255,255,255,255]);
  await drawShape(page,'crop',{x:10,y:10},{x:70,y:60});
  await page.locator('[data-action="applyCrop"]').first().evaluate(b=>b.click());
  await expect(page.locator('#stage')).toHaveAttribute('width','60');
  const cropped=await capturePng(page);expect(cropped.width).toBe(60);expect(cropped.height).toBe(50);
  expect(cropped.data.slice(0,4)).toEqual([255,255,255,255]);
});

test('new text has no Label suffix, and existing text can be edited, canceled, and undone', async ({ page, context }, testInfo) => {
  await page.goto('/solutions/imagesplat/');
  await page.locator('.tool-grid [data-tool="text"]').click();
  await page.locator('#stage').click({ position: { x: 100, y: 100 } });
  await expect(page.locator('#textValue')).toHaveValue('');
  await page.locator('#textInsert').click();
  await expect(page.locator('#textDialog')).toBeVisible();
  await expect(page.locator('#layerList .layer')).toHaveCount(0);
  const pasted = 'Practical strategies. Powerful learning.\nA second paragraph, exactly as pasted.';
  if (testInfo.project.name === 'chrome') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(text => navigator.clipboard.writeText(text), pasted);
    await page.locator('#textValue').focus();
    await page.keyboard.press('Control+V');
  } else {
    await page.locator('#textValue').fill(pasted);
  }
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await page.locator('#textFontFamily').selectOption("Georgia, 'Times New Roman', serif");
  await page.locator('#textSizeNumber').fill('40');
  await page.locator('#textBold').click();
  await page.locator('#textInsert').click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.locator('#layerList .layer .name').dblclick();
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await expect(page.locator('#textFontFamily')).toHaveValue("Georgia, 'Times New Roman', serif");
  await expect(page.locator('#textSizeNumber')).toHaveValue('40');
  await expect(page.locator('#textBold')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#textInsert')).toHaveText('Save changes');
  await page.locator('#textValue').fill('Changed wording\nAnother line');
  await page.locator('#textItalic').click();
  await page.locator('#textInsert').click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#textValue')).toHaveValue('Changed wording\nAnother line');
  await expect(page.locator('#textItalic')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#textValue').fill('Canceled change');
  await page.locator('#textCancel').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#textValue')).toHaveValue('Changed wording\nAnother line');
  await page.locator('#textCancel').click();
  await page.locator('[data-action="undo"]').last().click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.locator('#layerList .layer .name').dblclick();
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await expect(page.locator('#textItalic')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#textCancel').click();
  await page.locator('#stage').dblclick({ position: { x: 110, y: 110 } });
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await page.locator('#textCancel').click();
  await page.locator('[data-action="editText"]').evaluate(button => button.click());
  await expect(page.locator('#textValue')).toHaveValue(pasted);
});
