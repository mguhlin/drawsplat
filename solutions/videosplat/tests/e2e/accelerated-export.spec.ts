import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({page}) => { await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen','1')); });
for (const mode of ['auto', 'software', 'fallback', 'bad-encoder'] as const) test(`frame export retains duration and audible sound: ${mode}`, async ({ page }, info) => {
  if (mode === 'fallback') await page.addInitScript(() => { Object.defineProperty(window, 'VideoEncoder', { value: undefined, configurable: true }); });
  if (mode === 'bad-encoder') await page.addInitScript(() => {
    const configure = VideoEncoder.prototype.configure;
    VideoEncoder.prototype.configure = function(config) { configure.call(this, {...config, width:160, height:90}); };
  });
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(resolve('tests/fixtures/tone.webm'));
  await expect(page.locator('.timeline-clip.video')).toHaveCount(1);
  await page.getByRole('menuitem', {name:'File',exact:true}).click();
  await page.getByRole('menuitem', {name:'Export video…'}).click();
  await page.getByLabel('Export processing').selectOption(mode === 'fallback' || mode === 'bad-encoder' ? 'auto' : mode);
  await page.getByLabel('Export width').fill('320'); await page.getByLabel('Export height').fill('180');
  await page.getByLabel('Export range start').fill('0.3'); await page.getByLabel('Export range end').fill('1.7');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name:'Render local WebM'}).click();
  const download = await pending; const path = info.outputPath('export.webm'); await download.saveAs(path);
  if (mode === 'fallback' || mode === 'bad-encoder') await expect(page.getByText(/Restarting with compatible export/)).toBeVisible();
  else await expect(page.getByText(/Fast frame export/)).toBeVisible();
  if (mode === 'bad-encoder') await expect(page.getByText(/incorrect dimensions or duration/)).toBeVisible();
  const bytes = [...await readFile(path)];
  const result = await page.evaluate(async bytes => {
    const audio = new AudioContext();
    try {
      const decoded = await audio.decodeAudioData(new Uint8Array(bytes).buffer);
      const samples = decoded.getChannelData(0); let sum = 0; for (const n of samples) sum += n*n;
      return { duration: decoded.duration, rms: Math.sqrt(sum / samples.length) };
    } finally { await audio.close(); }
  }, bytes);
  expect(result.duration).toBeGreaterThan(1.3); expect(result.duration).toBeLessThan(1.6);
  expect(result.rms).toBeGreaterThan(.02);
});

test('canceling fast export does not restart compatible export or download a partial file', async ({ page }) => {
  let downloads = 0; page.on('download', () => downloads++);
  await page.goto('./');
  await page.locator('input[accept*=".srt"]').setInputFiles({name:'long.srt',mimeType:'application/x-subrip',buffer:Buffer.from('1\n00:00:00,000 --> 00:02:00,000\nCancel this export')});
  await page.getByRole('menuitem',{name:'File',exact:true}).click();
  await page.getByRole('menuitem',{name:'Export video…'}).click();
  await page.getByLabel('Export width').fill('640');await page.getByLabel('Export height').fill('360');
  await page.getByLabel('Include timeline audio').uncheck();
  await page.getByRole('button',{name:'Render local WebM'}).click();
  await expect(page.getByText(/Fast frame export/)).toBeVisible();
  await page.getByRole('button',{name:'Cancel export'}).click();
  await expect(page.getByLabel('Export processing')).toBeEnabled();
  await expect(page.getByText(/Restarting with compatible export/)).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Save another WebM copy'})).toHaveCount(0);
  expect(downloads).toBe(0);
});

test('MP4 export preserves dimensions and bypasses conversion when the encoder works', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.goto('./');
  const supported = await page.evaluate(async () => {
    try { return (await VideoEncoder.isConfigSupported({ codec: 'avc1.42001f', width: 320, height: 180, bitrate: 1000000, hardwareAcceleration: 'prefer-software' })).supported; } catch { return false; }
  });
  test.skip(!supported, 'Browser has no software AVC encoder');
  const requests: string[] = []; page.on('request', r => requests.push(r.url()));
  await page.locator('input[accept*=".srt"]').setInputFiles({name:'short.srt',mimeType:'application/x-subrip',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nDirect MP4')});
  await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Export video…'}).click();
  await page.getByLabel('Export processing').selectOption('software');await page.getByLabel('Export format').selectOption('mp4');
  await page.getByLabel('Export width').fill('320');await page.getByLabel('Export height').fill('180');
  await page.getByLabel('Include timeline audio').uncheck();
  const pending = page.waitForEvent('download');await page.getByRole('button',{name:'Render local MP4'}).click();
  const file = await pending;expect(file.suggestedFilename()).toMatch(/\.mp4$/);
  if (testInfo.project.name === 'chromium') {
    await expect(page.getByText('Fast frame export · software encoding')).toBeVisible();
    expect(requests.some(url => url.includes('/ffmpeg/'))).toBe(false);
  }
  const bytes = [...await readFile((await file.path())!)];
  const metadata = await page.evaluate(async bytes => {
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], {type:'video/mp4'}));
    const v = document.createElement('video');v.src=url;
    try { await new Promise<void>((resolve,reject) => {v.onloadeddata=()=>resolve();v.onerror=()=>reject(new Error('Invalid MP4'))});return {width:v.videoWidth,height:v.videoHeight,duration:v.duration}; }
    finally { v.removeAttribute('src');v.load();URL.revokeObjectURL(url); }
  }, bytes);
  expect(metadata.width).toBe(320);expect(metadata.height).toBe(180);expect(metadata.duration).toBeGreaterThan(1.9);expect(metadata.duration).toBeLessThan(2.2);
});
