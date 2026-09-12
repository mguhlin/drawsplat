import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fakeTranscriber } from '../../../shared/subtitles/tests/browser';
const resumeFile = resolve('../shared/subtitles/tests/long-speech.mp4');
async function openFile(page: import('@playwright/test').Page, path = resumeFile) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe', exact: false }).click();
  await page.locator('.drop-zone input').setInputFiles(path);
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
}
test('saves sections, exports partial results, and resumes after a reload without duplicate captions', async ({ page }) => {
  await fakeTranscriber(page, 1500);
  await openFile(page);
  await expect(page.getByLabel('Caption 1 text')).toBeVisible({ timeout: 15000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const partial = await pending;
  expect(partial.suggestedFilename()).toBe('long-speech.partial.srt');
  const partialText = await readFile((await partial.path())!, 'utf8');
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Transcribe', exact: false }).click();
  await page.locator('.drop-zone input').setInputFiles(resumeFile);
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toBeVisible();
  await expect(page.getByText(/^Complete transcript/)).toBeVisible({ timeout: 20000 });
  const completed = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const download = await completed;
  expect(download.suggestedFilename()).toBe('long-speech.srt');
  const text = await readFile((await download.path())!, 'utf8');
  expect(text.startsWith(partialText)).toBe(true);
  expect(text.match(/00:00:00,200/g)).toHaveLength(1);
  // A completed transcript restores without loading the recognition engine.
  await page.reload();
  await page.getByRole('button', { name: 'Transcribe', exact: false }).click();
  await page.locator('.drop-zone input').setInputFiles(resumeFile);
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect(page.getByText(/^Complete transcript/)).toBeVisible();
  expect(await page.evaluate(() => (window as any).subtitleJobs)).toEqual([]);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await page.getByRole('button', { name: 'Cancel generation' }).click();
});
test('continues with partial downloads when local saving is unavailable', async ({ page }) => {
  await fakeTranscriber(page);
  await page.addInitScript(() => {
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = ((name: string, version?: number) => {
      if (name === 'splat-transcription-progress-v1') throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return open(name, version);
    }) as typeof indexedDB.open;
  });
  await openFile(page, resolve('tests/fixtures/speech.mp3'));
  await expect(page.getByText(/Saving is unavailable/)).toBeVisible();
  await expect(page.getByText(/^Complete transcript/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download SRT', exact: true })).toBeEnabled();
});
test('streams a two-hour recording using bounded audio buffers and paginated captions', async ({ page }) => {
  test.skip(!process.env.LONG_AUDIO_FIXTURE, 'Set LONG_AUDIO_FIXTURE to a near-two-hour audio fixture');
  test.setTimeout(180000);
  await fakeTranscriber(page, 0);
  await page.addInitScript(() => {
    const Original = OfflineAudioContext;
    (window as any).maxDecodedFrames = 0;
    (window as any).OfflineAudioContext = class extends Original {
      constructor(channels: number, length: number, rate: number) {
        super(channels, length, rate);
        (window as any).maxDecodedFrames = Math.max((window as any).maxDecodedFrames, length);
      }
      decodeAudioData(): Promise<AudioBuffer> { throw new Error('Whole-file decoding is forbidden in the long-file test'); }
    };
  });
  await openFile(page, process.env.LONG_AUDIO_FIXTURE!);
  await expect(page.getByText(/^Complete transcript/)).toBeVisible({ timeout: 150000 });
  const stats = await page.evaluate(() => ({ maxFrames: (window as any).maxDecodedFrames, jobs: (window as any).subtitleJobs }));
  expect(stats.maxFrames).toBeLessThanOrEqual(25 * 16000);
  expect(stats.jobs.length).toBeGreaterThan(280);
  expect(Math.max(...stats.jobs.map((job: { samples: number }) => job.samples))).toBeLessThanOrEqual(25 * 16000);
  expect(await page.locator('.subtitle-cue').count()).toBeLessThanOrEqual(50);
  await expect(page.getByRole('button', { name: 'Next captions' })).toBeEnabled();
});

test('real speech model transcribes across multiple streaming windows', async ({ page }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in real speech model');
  test.setTimeout(180000);
  await openFile(page);
  await expect(page.getByText(/^Complete transcript/)).toBeVisible({ timeout: 150000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const text = await readFile((await (await pending).path())!, 'utf8');
  expect(text).toMatch(/fellow Americans/i);
  expect(text).toMatch(/00:00:4[0-9],/);
  expect((text.match(/fellow Americans/gi) ?? []).length).toBeGreaterThanOrEqual(3);
});

test('rejects ranges beyond two hours before starting speech recognition', async ({ page }) => {
  await fakeTranscriber(page);
  await page.addInitScript(() => Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get: () => 7201 }));
  await openFile(page, resolve('tests/fixtures/speech.mp3'));
  await expect(page.getByRole('alert')).toContainText('120 minutes');
  expect(await page.evaluate(() => (window as any).subtitleJobs)).toEqual([]);
});
