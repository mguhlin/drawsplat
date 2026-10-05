/* Serve the repository root locally, or set CLIPSPLAT_ORIGIN for deployment checks.
   Requires ffmpeg/ffprobe, root Playwright dependency and Chrome. */
const { chromium } = require('../../../node_modules/@playwright/test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const origin = process.env.CLIPSPLAT_ORIGIN || 'http://127.0.0.1:4186';
const artifacts = mkdtempSync(join(tmpdir(), 'clipsplat-test-'));
const audio = join(artifacts, 'audio.mp4'), silent = join(artifacts, 'silent.mp4');
const common = ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=320x240:r=30'];
execFileSync('ffmpeg', [...common, '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-y', audio]);
execFileSync('ffmpeg', [...common, '-t', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', silent]);
const openingImage = join(artifacts, 'opening.png'), closingImage = join(artifacts, 'closing.png');
for (const [file, color, size] of [[openingImage, 'blue', '320x80'], [closingImage, 'lime', '80x320']]) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=${size}`, '-frames:v', '1', '-threads', '1', '-y', file]);
}
function imagePixel(file, seconds, expected) {
  const rgb = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seconds), '-i', file, '-vf', 'crop=2:2:496:526', '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']);
  assert.ok(expected.every((value, i) => Math.abs(rgb[i] - value) < 12), `Exported panel pixel ${[...rgb.subarray(0,3)]} should match ${expected}`);
}
function probe(file, height, duration) {
  const data = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));
  const video = data.streams.find(s => s.codec_type === 'video'), audio = data.streams.find(s => s.codec_type === 'audio');
  assert.equal(video.codec_name, 'h264'); assert.equal(video.width, 1080); assert.equal(video.height, height);
  assert.equal(video.r_frame_rate, '30/1'); assert.equal(video.pix_fmt, 'yuv420p');
  assert.equal(audio.codec_name, 'aac'); assert.equal(audio.sample_rate, '48000'); assert.equal(audio.channels, 2);
  assert.ok(Math.abs(Number(data.format.duration) - duration) < .15);
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CLIPSPLAT_CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${origin}/solutions/clipsplat/`);
    await page.locator('#creator').fill('Miguel Guhlin');
    await page.locator('#intro-duration').fill('1'); await page.locator('#outro-duration').fill('1');
    async function load(path) {
      await page.locator('#file').setInputFiles(path);
      await page.waitForFunction(() => !document.getElementById('export').disabled);
    }
    async function exportMP4(name) {
      await page.locator('#export').click();
      await page.waitForFunction(() => document.getElementById('download').style.display === 'inline-block' || (!document.getElementById('export').disabled && document.getElementById('progress').hidden), {}, { timeout: 120000 });
      assert.match(await page.locator('#status').textContent(), /MP4 ready/);
      const download = page.waitForEvent('download'); await page.locator('#download').click();
      const path = join(artifacts, name); await (await download).saveAs(path); return path;
    }
    await load(audio);
    await page.locator('#intro-image').setInputFiles(openingImage);
    await page.locator('#intro-image-thumbnail').waitFor({state:'visible'});
    await page.waitForFunction(() => !document.getElementById('intro-choose-image').disabled);
    await page.locator('#outro-image').setInputFiles(closingImage);
    await page.locator('#outro-image-thumbnail').waitFor({state:'visible'});
    await page.waitForFunction(() => !document.getElementById('outro-choose-image').disabled);
    const previewPixel = () => page.locator('#canvas').evaluate(async canvas => { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); return [...canvas.getContext('2d').getImageData(496, 526, 1, 1).data].slice(0,3); });
    assert.deepEqual(await previewPixel(), [0,254,0]);
    await page.locator('#show-opening').click();
    assert.deepEqual(await previewPixel(), [0,0,254]);
    await page.locator('#intro-image').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});
    await page.waitForFunction(() => document.getElementById('status').textContent.includes('could not be opened'));
    assert.deepEqual(await previewPixel(), [0,0,254]);
    await page.locator('#intro-image').setInputFiles(openingImage);
    await page.waitForFunction(() => !document.getElementById('intro-choose-image').disabled);
    const reel = await exportMP4('reel.mp4');
    probe(reel, 1920, 5);
    imagePixel(reel, .5, [0,0,254]);
    imagePixel(reel, 4.5, [0,255,0]);
    await page.locator('#intro-remove-image').click();
    assert.ok(await page.locator('#intro-image-details').isHidden());
    assert.ok(await page.locator('#download').isHidden());
    assert.deepEqual(await previewPixel(), [71,32,164]);
    await page.locator('#outro-remove-image').click();
    assert.ok(await page.locator('#outro-image-details').isHidden());
    // The middle must retain actual source audio; a track filled with silence is insufficient.
    const analysis = require('node:child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', join(artifacts, 'reel.mp4'), '-ss', '1.5', '-t', '1', '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
    const volume = Number(analysis.match(/mean_volume: ([\d.-]+) dB/)[1]); assert.ok(volume > -35);
    await load(silent); await page.locator('#preset').selectOption('feed'); await page.locator('#fit').selectOption('crop');
    probe(await exportMP4('silent-feed.mp4'), 1350, 5);
    await page.locator('#preset').selectOption('story');
    await page.locator('#intro-duration').fill('0'); await page.locator('#outro-duration').fill('0');
    await page.locator('#export').click(); await page.locator('#cancel').click();
    await page.waitForFunction(() => !document.getElementById('export').disabled);
    assert.match(await page.locator('#status').textContent(), /cancelled/);
    probe(await exportMP4('no-panels.mp4'), 1920, 3);
    await page.locator('#end').fill('999'); assert.ok(await page.locator('#export').isDisabled());
    await page.locator('#end').fill('3');
    await page.locator('#camera').click(); await page.waitForFunction(() => !document.getElementById('record').disabled);
    await page.locator('#record').click(); await page.waitForTimeout(3400); await page.locator('#stop').click();
    await page.waitForFunction(() => document.getElementById('source-name').textContent.includes('Camera recording') && !document.getElementById('export').disabled, {}, { timeout: 20000 });
    const recordedDuration = Number(await page.locator('#end').inputValue());
    probe(await exportMP4('camera.mp4'), 1920, recordedDuration);
    await page.screenshot({ path: join(artifacts, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: join(artifacts, 'mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(`PASS: panel image previews/export pixels, replacement/removal/invalid image, Reel/audio, silent feed/crop, Story/skipped panels, cancel/retry, invalid trims, camera MP4, mobile layout; ${origin}; artifacts ${artifacts}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
