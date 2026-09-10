import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { fakeTranscriber, silentWav } from '../../../shared/subtitles/tests/browser';
const speech = resolve('../shared/subtitles/tests/speech.mp4');
async function openGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate subtitles…', exact: true }).click();
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
}
test('generates for a trimmed clip, validates edits, downloads SRT and adds captions at the clip position', async ({ page }) => {
  await fakeTranscriber(page);
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(speech);
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await page.getByLabel('Timeline start', { exact: true }).fill('20');
  await page.getByLabel('Clip duration', { exact: true }).fill('4');
  await page.getByLabel('Source start', { exact: true }).fill('2');
  await openGeneration(page);
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  expect(await page.evaluate(() => (window as any).subtitleJobs[0].samples)).toBe(64000);
  await page.getByLabel('Caption 1 text').fill('Corrected speech');
  await page.getByLabel('Caption 1 end').fill('0');
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await expect(page.getByRole('alert')).toContainText('valid start/end');
  await page.getByLabel('Caption 1 end').fill('1.2');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const srt = await (await download).createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of srt!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain('00:00:00,200 --> 00:00:01,200\nCorrected speech');
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await expect(page.getByRole('dialog', { name: 'Generate subtitles' })).toHaveCount(0);
  await expect(page.locator('.timeline-clip')).toHaveCount(3);
  await page.locator('.timeline-clip').filter({ hasText: 'Corrected speech' }).click();
  await expect(page.getByLabel('Timeline start', { exact: true })).toHaveValue('20.2');
});
test('cancels generation without adding stale captions', async ({ page }) => {
  await fakeTranscriber(page, 10000);
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(speech);
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await openGeneration(page);
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  expect(await page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
  await expect(page.getByRole('button', { name: 'Add subtitles to timeline' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close subtitle generation' }).click();
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
});
test('rejects silent audio without starting the speech model', async ({ page }) => {
  await fakeTranscriber(page);
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({ name: 'silent.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await openGeneration(page);
  await expect(page.getByRole('alert')).toContainText('audio is silent');
  expect(await page.evaluate(() => (window as any).subtitleJobs)).toEqual([]);
});
test('real local speech model produces captions and reuses its cache offline', async ({ page, context }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in real model download test');
  test.setTimeout(180000);
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  const remoteMethods: string[] = [];
  context.on('request', request => { if (/^https:/.test(request.url())) remoteMethods.push(request.method()); });
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(speech);
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await openGeneration(page);
  await expect(page.getByLabel('Caption 1 text')).toContainText(/fellow Americans/i, { timeout: 120000 });
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Generate again' }).click();
  await expect(page.getByRole('button', { name: 'Cancel generation' })).toHaveCount(0, { timeout: 60000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByLabel('Caption 1 text')).toContainText(/fellow Americans/i);
  expect(remoteMethods.every(method => method === 'GET')).toBe(true);
});

test('recording option starts subtitle generation automatically after adding the clip', async ({ page }) => {
  await fakeTranscriber(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      enumerateDevices: async () => [{ kind: 'audioinput', deviceId: 'tone', label: 'Test microphone' }],
      addEventListener: () => {}, removeEventListener: () => {},
      getUserMedia: async (constraints: MediaStreamConstraints) => {
        if (constraints.audio) { const context = new AudioContext(); await context.resume(); const tone = context.createOscillator(), output = context.createMediaStreamDestination(); tone.connect(output); tone.start(); return output.stream; }
        const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90; const context = canvas.getContext('2d')!;
        context.fillRect(0, 0, 160, 90); const stream = canvas.captureStream(15);
        const timer = setInterval(() => { if (stream.getVideoTracks()[0].readyState === 'ended') { clearInterval(timer); return; } context.fillRect(0, 0, 160, 90); }, 60);
        return stream;
      },
    } });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Record video', exact: true }).click();
  await page.getByLabel('Recording source').selectOption('camera');
  await page.getByLabel('Recording countdown').selectOption('0');
  await page.getByRole('button', { name: 'Start recording', exact: true }).click();
  await expect(page.getByText('Audio detected', { exact: true })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Stop and choose crop', exact: true }).click();
  await page.getByLabel('Generate subtitles when adding this recording (English)').check();
  await page.getByRole('button', { name: 'Use full recording', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Generate subtitles' })).toBeVisible();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await expect(page.locator('.timeline-clip')).toHaveCount(3);
});

test('real model retains repeated speech after the first 30 seconds', async ({ page }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in long audio regression');
  test.setTimeout(180000);
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(resolve('../shared/subtitles/tests/long-speech.mp4'));
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await openGeneration(page);
  await expect(page.getByRole('button', { name: 'Add subtitles to timeline' })).toBeVisible({ timeout: 120000 });
  const starts = await page.locator('.subtitle-cue input[aria-label$=" start"]').evaluateAll(inputs => inputs.map(input => Number((input as HTMLInputElement).value)));
  expect(Math.max(...starts)).toBeGreaterThan(35);
  expect(await page.locator('.subtitle-cue textarea').count()).toBeGreaterThanOrEqual(7);
});
