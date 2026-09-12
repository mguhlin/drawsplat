import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fakeTranscriber } from '../../../shared/subtitles/tests/browser';
function modelBytes(change = 0) {
  const bytes = Buffer.alloc(4096);
  [0x67676d6c, 51864, 1500, 384, 6, 4, 448, 384, 6, 4, 80, 1].forEach((value, i) => bytes.writeInt32LE(value, i * 4));
  bytes[100] = change; return bytes;
}
async function open(page: import('@playwright/test').Page) {
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(resolve('../shared/subtitles/tests/speech.mp4'));
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate subtitles…', exact: true }).click();
  await page.getByLabel('English speech model').selectOption('local');
}
test('validates local models and isolates progress by their contents', async ({ page }) => {
  await fakeTranscriber(page, 500);
  await open(page);
  const generate = page.getByRole('button', { name: 'Generate subtitles', exact: true });
  const file = page.getByLabel('Local Whisper model (.bin)');
  await expect(generate).toBeDisabled();
  await file.setInputFiles({ name: 'bad.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(100) });
  await generate.click();
  await expect(page.getByRole('alert')).toContainText('Whisper GGML');
  expect(await page.evaluate(() => (window as any).subtitleJobs)).toEqual([]);
  for (const change of [0, 1]) {
    await file.setInputFiles({ name: 'same-name.bin', mimeType: 'application/octet-stream', buffer: modelBytes(change) });
    await generate.click();
    await expect(file).toBeDisabled();
    await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
    await expect(file).toBeEnabled();
  }
  expect(await page.evaluate(() => (window as any).subtitleJobs.map((job: any) => job.model))).toEqual(['local', 'local']);
  await file.setInputFiles({ name: 'renamed.bin', mimeType: 'application/octet-stream', buffer: modelBytes(0) });
  await generate.click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  expect(await page.evaluate(() => (window as any).subtitleJobs.length)).toBe(2);
  await open(page);
  await expect(generate).toBeDisabled();
  await file.setInputFiles({ name: 'same-name.bin', mimeType: 'application/octet-stream', buffer: modelBytes(0) });
  await generate.click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  expect(await page.evaluate(() => (window as any).subtitleJobs.length)).toBe(0);
});
test('transcribes using an actual GGML model selected from disk without model downloads', async ({ page }) => {
  test.skip(!process.env.LOCAL_GGML_MODEL, 'Provide a local GGML model path');
  test.setTimeout(1200000);
  const remote: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:') && /^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('console', message => { if (message.type() === 'error') console.log('browser:', message.text()); });
  await open(page);
  await page.getByLabel('Local Whisper model (.bin)').setInputFiles(process.env.LOCAL_GGML_MODEL!);
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel generation' })).toHaveCount(0, { timeout: 1100000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const download = await pending;
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).toMatch(/fellow Americans/i);
  expect(text).toMatch(/country/i);
  expect(text).toContain('-->');
  expect(remote).toEqual([]);
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  expect(await page.locator('.timeline-clip').count()).toBeGreaterThan(1);
  console.log('Local GGML model produced:', text);
});

test('cancels a local-model job and keeps model changes from reusing stale output', async ({ page }) => {
  await fakeTranscriber(page, 10000);
  await open(page);
  const input = page.getByLabel('Local Whisper model (.bin)');
  await input.setInputFiles({ name: 'test.bin', mimeType: 'application/octet-stream', buffer: modelBytes() });
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await expect(input).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  expect(await page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
  await page.getByLabel('English speech model').selectOption('small');
  await page.getByLabel('English speech model').selectOption('local');
  await expect(page.getByRole('button', { name: 'Generate subtitles', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Caption 1 text')).toHaveCount(0);
});
