const { test, expect } = require('@playwright/test');

test('tolerance and smoothing preserve source alpha and disconnected pixels', async ({ page }) => {
  await page.goto('/solutions/imagesplat/');
  const result = await page.evaluate(async () => {
    const { removeColor } = await import('/solutions/imagesplat/remove-color.js?v=20260915');
    const source = new ImageData(new Uint8ClampedArray([0,255,0,255, 30,225,30,128, 255,0,0,255, 0,255,0,255]), 4, 1);
    const options = {color:[0,255,0], tolerance:10, smoothing:40};
    return { soft:[...removeColor(source, options).data], hard:[...removeColor(source,{...options,smoothing:0}).data], connected:[...removeColor(source,{...options,mode:'connected',seed:{x:0,y:0}}).data], source:[...source.data] };
  });
  expect(result.soft[3]).toBe(0);
  expect(result.soft[7]).toBe(64);
  expect(result.hard[7]).toBe(128);
  expect(result.soft[11]).toBe(255);
  expect(result.connected[15]).toBe(255);
  expect(result.source[3]).toBe(255);
});
