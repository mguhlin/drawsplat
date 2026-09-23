const { test, expect } = require('@playwright/test');
const { PDFDocument } = require('../vendor/pdf-lib.min.js');
const fs = require('fs/promises');

test('finger signatures retain multiple strokes, support cancellation and export in place', async ({ page }) => {
  const pdf = await PDFDocument.create(); pdf.addPage([400, 600]);
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({name:'sign.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await expect(page.locator('#drawButton')).toBeEnabled();
  await page.locator('#signatureButton').click();
  await page.locator('#signatureDraw').click();
  const layer = page.locator('#annotationLayer');
  await expect(layer).toHaveCSS('touch-action', 'none');
  // Synthetic touch events exercise pointer identity and cancellation on all engines.
  await layer.evaluate(node => {
    node.setPointerCapture = () => {};
    node.hasPointerCapture = () => false;
    const r = node.getBoundingClientRect();
    const send = (type, id, x, y, primary = true) => node.dispatchEvent(new PointerEvent(type, {
      bubbles:true, cancelable:true, pointerType:'touch', pointerId:id,
      isPrimary:primary, button:0, clientX:r.left+x*r.width,clientY:r.top+y*r.height
    }));
    for (const y of [.2,.3]) {
      send('pointerdown',1,.2,y); send('pointermove',2,.9,.9,false);
      send('pointerup',2,.9,.9,false);
      send('pointermove',1,.6,y); send('pointerup',1,.6,y);
    }
    send('pointerdown',1,.2,.4); send('pointermove',1,.6,.4); send('pointercancel',1,.6,.4);
  });
  await expect(page.locator('.drawing-object')).toHaveCount(2);
  await expect(page.locator('#inkTools')).toBeVisible();
  const bounds = await page.locator('.drawing-object polyline').first().evaluate(n => {
    const b = n.getBoundingClientRect(), r = document.querySelector('#annotationLayer').getBoundingClientRect();
    return [(b.left-r.left)/r.width,(b.top-r.top)/r.height,b.width/r.width];
  });
  expect(bounds[0]).toBeCloseTo(.2,2); expect(bounds[1]).toBeCloseTo(.2,2); expect(Math.abs(bounds[2]-.4)).toBeLessThan(.015);
  await page.locator('#inkUndo').click();
  await expect(page.locator('.drawing-object')).toHaveCount(1);
  await expect(page.locator('#inkTools')).toBeVisible();
  await page.locator('#inkDone').click();
  await expect(layer).not.toHaveCSS('touch-action','none');
  const pending = page.waitForEvent('download');
  await page.locator('#saveAsSelect').selectOption('pdf');
  const bytes = await fs.readFile(await (await pending).path());
  await page.locator('#fileInput').setInputFiles({name:'signed.pdf',mimeType:'application/pdf',buffer:bytes});
  await expect(page.locator('.drawing-object')).toHaveCount(0);
  // Reopened export has dark ink at the original page coordinates.
  await expect.poll(() => page.locator('#pdfCanvas').evaluate(c => {
    const ctx=c.getContext('2d'), x=Math.round(c.width*.4),y=Math.round(c.height*.2);
    const p=ctx.getImageData(x,y,1,1).data;return p[0]<100;
  })).toBe(true);
});

test('real pointer strokes stay active until Done', async ({page}) => {
  const pdf=await PDFDocument.create();pdf.addPage([400,600]);
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({name:'ink.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await page.locator('#drawButton').click();
  await page.locator('#annotationLayer').scrollIntoViewIfNeeded();
  const r=await page.locator('#annotationLayer').boundingBox();
  const view=await page.locator('#documentView').boundingBox();
  const startY=Math.max(r.y,view.y)+40;
  for (const y of [startY,startY+30]) {
    await page.mouse.move(r.x+r.width*.25,y); await page.mouse.down();
    await page.mouse.move(r.x+r.width*.5,y,{steps:8});await page.mouse.up();
  }
  await expect(page.locator('.drawing-object')).toHaveCount(2);
  await expect(page.locator('#drawButton')).toHaveAttribute('aria-pressed','true');
});

test('phone touch gestures draw without scrolling and a tap makes a dot', async ({page,browserName}) => {
  test.skip(browserName !== 'chromium', 'CDP touchscreen gesture test');
  await page.setViewportSize({width:390,height:844});
  const pdf=await PDFDocument.create();pdf.addPage([400,600]);
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({name:'touch.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await page.locator('#drawButton').click();
  const view=page.locator('#documentView');
  const r=await view.boundingBox(), x=r.x+100,y=r.y+60;
  const scroll=await view.evaluate(n=>n.scrollTop);
  const cdp=await page.context().newCDPSession(page);
  for (const dot of [false,true]) {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    if (!dot) for (let i=1;i<=10;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*5,y:y+i*4}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await expect(page.locator('.drawing-object')).toHaveCount(2);
  expect(await view.evaluate(n=>n.scrollTop)).toBe(scroll);
  await page.screenshot({path:'/tmp/pdfsplat-touch-phone.png'});
});
