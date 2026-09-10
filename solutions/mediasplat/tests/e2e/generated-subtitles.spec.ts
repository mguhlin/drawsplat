import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { fakeTranscriber } from '../../../shared/subtitles/tests/browser';
const speech = resolve('../shared/subtitles/tests/speech.mp4');
async function openGeneration(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Subtitles' }).click();
  await page.locator('.drop-zone input').setInputFiles(speech);
  await page.getByRole('button', { name: 'Generate subtitles…', exact: true }).click();
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
}
test('reviews generated captions, downloads SRT and selects them for burn-in', async ({ page }) => {
  await fakeTranscriber(page);
  await openGeneration(page);
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  await page.getByLabel('Caption 1 text').fill('Edited caption');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT' }).click();
  expect((await download).suggestedFilename()).toBe('speech.srt');
  await page.getByRole('button', { name: 'Use subtitles for burn-in' }).click();
  await expect(page.getByText('Selected subtitles: speech.srt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Burn subtitles to MP4' })).toBeEnabled();
  await page.locator('.drop-zone input').setInputFiles([]);
  await page.locator('.drop-zone input').setInputFiles(speech);
  await expect(page.getByRole('button', { name: 'Burn subtitles to MP4' })).toBeDisabled();
});
test('real speech generation feeds MediaSplat MP4 burn-in', async ({ page }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in real model and FFmpeg test');
  test.setTimeout(180000);
  await openGeneration(page);
  await expect(page.getByLabel('Caption 1 text')).toHaveValue(/fellow Americans/i, { timeout: 120000 });
  await page.getByLabel('Caption 1 text').fill('Generated captions work in MediaSplat.');
  await page.getByRole('button', { name: 'Use subtitles for burn-in' }).click();
  await page.getByRole('button', { name: 'Burn subtitles to MP4' }).click();
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible({ timeout: 120000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const output = await pending;
  expect(output.suggestedFilename()).toMatch(/\.mp4$/);
  expect(await output.failure()).toBeNull();
});
