import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
function wav() {
  const frames=48000, bytes=Buffer.alloc(44+frames*2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length-8,4); bytes.write('WAVEfmt ',8);
  bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);
  bytes.writeUInt32LE(48000,24);bytes.writeUInt32LE(96000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);
  bytes.write('data',36);bytes.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++) bytes.writeInt16LE(i<24000 ? Math.round(Math.sin(i * Math.PI * 2 * 1000 / 48000) * 16384) : 0,44+i*2);
  return bytes;
}
async function save(page: Page) {
  await page.getByText('File',{exact:true}).click();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download project',exact:true}).click();
  const path = await (await pending).path();
  return JSON.parse(await readFile(path!, 'utf8'));
}
test('analysis reports source levels and leaves saved audio and project edits unchanged', async({page})=>{
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.locator('#audio-input').setInputFiles({name:'levels.wav',mimeType:'audio/wav',buffer:wav()});
  await expect(page.locator('[data-clip]')).toHaveCount(1);
  const before=await save(page);
  await page.getByText('Clip',{exact:true}).click();
  await page.getByRole('button',{name:'Analyze audio',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('Whole clip');
  await expect(dialog).toContainText('before clip gain');
  await expect(dialog).toContainText('-6.02 dBFS');
  await expect(dialog).toContainText('not true-peak or LUFS');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const after=await save(page);
  expect(after).toEqual(before);
});
test('analysis honors waveform range selection and fits a phone',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.locator('#audio-input').setInputFiles({name:'range.wav',mimeType:'audio/wav',buffer:wav()});
  const canvas=page.locator('[data-clip] canvas');
  const box=await canvas.boundingBox();
  await page.mouse.move(box!.x+box!.width*.6,box!.y+box!.height/2);
  await page.mouse.down();await page.mouse.move(box!.x+box!.width*.9,box!.y+box!.height/2,{steps:8});await page.mouse.up();
  await page.getByText('Clip',{exact:true}).click();await page.getByRole('button',{name:'Analyze audio',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('Selected range');
  await expect(dialog).toContainText('−∞ dBFS');
  const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({path:'/tmp/audiosplat-analysis-phone.png'});
});
test('analyzing with no clip explains the selection requirement',async({page})=>{
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.getByText('Clip',{exact:true}).click();await page.getByRole('button',{name:'Analyze audio',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#toast')).toBeVisible();
});
