/* Run against the repository-root server or a deployment with CLIPSPLAT_ORIGIN. */
const { chromium } = require('../../../node_modules/@playwright/test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const origin = process.env.CLIPSPLAT_ORIGIN || 'http://127.0.0.1:4186';
const artifacts = mkdtempSync(join(tmpdir(), 'splat-handoff-'));
function probe(file) {
  return JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    for (const format of ['reel', 'story', 'feed']) {
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        sessionStorage.setItem('videosplat-splash-seen', '1');
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
          const audio = new AudioContext();
          const destination = audio.createMediaStreamDestination();
          const oscillator = audio.createOscillator();
          oscillator.connect(destination); oscillator.start();
          await audio.resume();
          return destination.stream;
        }});
        Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 320; canvas.height = 180;
          document.body.append(canvas);
          const ctx = canvas.getContext('2d');
          const stream = canvas.captureStream(15);
          let n = 0;
          const draw = () => { ctx.fillStyle = `rgb(${n++ % 255},80,180)`; ctx.fillRect(0, 0, 320, 180); };
          draw();
          const timer = setInterval(draw, 66);
          stream.getTracks()[0].addEventListener('ended', () => clearInterval(timer));
          return stream;
        }});
      });
      await page.goto(origin + '/solutions/videosplat/');
      await page.getByRole('button', { name: 'Record video', exact: true }).click();
      await page.getByLabel('Recording frame').selectOption(format);
      await page.getByLabel('Recording countdown').selectOption('0');
      await page.getByRole('button', { name: 'Start recording', exact: true }).click();
      await page.getByRole('button', { name: 'Stop and choose crop' }).waitFor();
      assert.equal(await page.locator('.instagram-frame').count(), 1);
      await page.waitForTimeout(2200);
      await page.getByRole('button', { name: 'Stop and choose crop' }).click();
      await page.getByRole('button', { name: 'Put into ClipSplat' }).waitFor();
      await page.locator('.crop-stage video').evaluate(video => video.readyState >= 1 ? null : new Promise(resolve => video.addEventListener('loadedmetadata', resolve, { once: true })));
      const frame = await page.locator('.crop-selection').evaluate(node => ({ width: parseFloat(node.style.width), height: parseFloat(node.style.height) }));
      assert.ok(Math.abs(frame.width * 320 / (frame.height * 180) - (format === 'feed' ? .8 : 9 / 16)) < .001);
      // Reposition while preserving the selected ratio.
      const stage = await page.locator('.crop-stage').boundingBox();
      await page.mouse.click(stage.x + stage.width * .7, stage.y + stage.height * .5);
      const popupPromise = context.waitForEvent('page');
      await page.getByRole('button', { name: 'Put into ClipSplat' }).click();
      const clip = await popupPromise;
      await clip.waitForURL('**/solutions/clipsplat/**', { timeout: 45000 });
      await clip.waitForFunction(() => document.querySelector('#status')?.textContent.includes('VideoSplat recording ready'), { timeout: 30000 });
      assert.equal(await page.getByRole('button', { name: 'Close recorder' }).count(), 0);
      assert.equal(await clip.locator('#preset').inputValue(), format);
      assert.ok(!(new URL(clip.url())).searchParams.has('videosplat-transfer'));
      assert.equal(await clip.evaluate(() => window.opener), null);
      await clip.locator('.workflow-step').evaluateAll(nodes => nodes.forEach(node => node.open = true));
      assert.equal(await clip.locator('#export').isEnabled(), true);
      const originalDownload = clip.waitForEvent('download');
      await clip.locator('#original').click();
      const original = await originalDownload;
      const originalFile = join(artifacts, format + '-original.webm');
      await original.saveAs(originalFile);
      const originalProbe = probe(originalFile);
      const originalVideo = originalProbe.streams.find(s => s.codec_type === 'video');
      assert.equal(originalVideo.width, 320);
      assert.equal(originalVideo.height, 180);
      assert.ok(originalProbe.streams.some(s => s.codec_type === 'audio'));
      const keys = await clip.evaluate(() => new Promise((resolve, reject) => {
        const open = indexedDB.open('splat-video-handoff-v1', 1);
        open.onsuccess = () => {
          const db = open.result;
          const request = db.transaction('recordings').objectStore('recordings').getAllKeys();
          request.onsuccess = () => { db.close(); resolve(request.result); };
          request.onerror = () => reject(request.error);
        };
      }));
      assert.deepEqual(keys, []);
      // Verify real MP4 encoding of the transferred crop with preserved audio.
      if (format === 'reel') {
        await clip.locator('#intro-duration').fill('1');
        await clip.locator('#outro-duration').fill('1');
        await clip.locator('#export').click();
        await clip.locator('#download').waitFor({ state: 'visible', timeout: 180000 });
        const outputPromise = clip.waitForEvent('download');
        await clip.locator('#download').click();
        const output = await outputPromise;
        const outputFile = join(artifacts, 'reel.mp4');
        await output.saveAs(outputFile);
        const outputProbe = probe(outputFile);
        const video = outputProbe.streams.find(s => s.codec_type === 'video');
        assert.equal(video.width, 1080); assert.equal(video.height, 1920);
        assert.equal(video.codec_name, 'h264');
        assert.equal(outputProbe.streams.find(s => s.codec_type === 'audio').codec_name, 'aac');
        const volumeLog = require('node:child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', outputFile, '-ss', '1.2', '-t', '0.5', '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
        assert.ok(Number(volumeLog.match(/mean_volume: ([\d.-]+) dB/)[1]) > -35, 'Transferred microphone must contain sound, not a silent track');
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${format}: framed recording, local transfer, original audio/download, selected format, consumed storage`, origin);
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(origin + '/solutions/clipsplat/?videosplat-transfer=12345678-1234-1234-1234-123456789abc');
    await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('unavailable'));
    await page.locator('.workflow-step').evaluateAll(nodes => nodes.forEach(node => node.open = true));
    assert.equal(await page.locator('#choose-file').isEnabled(), true);
    console.log('PASS unavailable transfer keeps normal import usable; artifacts:', artifacts);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
