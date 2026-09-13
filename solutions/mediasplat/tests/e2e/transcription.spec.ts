import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fakeTranscriber, silentWav } from '../../../shared/subtitles/tests/browser';

for (const extension of ['mp3', 'ogg', 'm4a']) {
  test(`transcribes ${extension} and exports reviewed SRT and text`, async ({ page }) => {
    await fakeTranscriber(page);
    await page.goto('./');
    await page.getByRole('button', { name: 'Transcribe' }).click();
    await page.locator('.drop-zone input').setInputFiles(resolve(`tests/fixtures/speech.${extension}`));
    await expect(page.getByRole('button', { name: 'Burn subtitles to MP4' })).toHaveCount(0);
    await expect(page.getByText('Cut quality', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
    await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
    await page.getByLabel('Caption 1 text').fill('Reviewed speech');
    for (const [label, suffix] of [['Download SRT', 'srt'], ['Download transcript (.txt)', 'txt']]) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: label, exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(`speech.${suffix}`);
      const contents = await readFile((await download.path())!, 'utf8');
      expect(contents).toContain('Reviewed speech');
      if (suffix === 'srt') expect(contents).toContain('00:00:00,200 --> 00:00:01,200');
      else expect(contents).toBe('Reviewed speech\n\nReview this caption\n');
    }
    await page.locator('.drop-zone input').setInputFiles({ name: 'replacement.mp3', mimeType: 'audio/mpeg', buffer: await readFile(resolve('tests/fixtures/speech.mp3')) });
    await expect(page.getByLabel('Caption 1 text')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Download SRT' })).toHaveCount(0);
  });
}
test('cancels transcription on tool switch and preserves audio editing', async ({ page }) => {
  await fakeTranscriber(page, 10000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await page.getByRole('button', { name: 'Trim', exact: false }).first().click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  await expect(page.getByRole('button', { name: 'Trim media', exact: true })).toBeEnabled();
});
test('reports silent and undecodable audio without starting speech recognition', async ({ page }) => {
  await fakeTranscriber(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  for (const [name, mimeType, buffer, error] of [
    ['silent.wav', 'audio/wav', silentWav(), 'This audio is silent'],
    ['broken.mp3', 'audio/mpeg', Buffer.from('invalid audio'), 'No decodable audio was found'],
  ] as const) {
    await page.locator('.drop-zone input').setInputFiles({ name, mimeType, buffer });
    await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(error);
  }
  expect(await page.evaluate(() => (window as any).subtitleJobs)).toEqual([]);
});
test('real MP3 speech recognition exports a transcript', async ({ page }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in real model test');
  test.setTimeout(180000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue(/fellow Americans/i, { timeout: 120000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download transcript (.txt)' }).click();
  expect(await readFile((await (await pending).path())!, 'utf8')).toMatch(/fellow Americans/i);
});

 test('selects models, isolates saved transcripts and remembers the choice', async ({ page }) => {
  await fakeTranscriber(page, 500);
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  const selector = page.getByLabel('English speech model');
  await expect(selector).toHaveValue('small');
  for (const model of ['small', 'medium', 'turbo', 'tiny']) {
    await selector.selectOption(model);
    await expect(page.getByLabel('Caption 1 text')).toHaveCount(0);
    await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
    await expect(selector).toBeDisabled();
    await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
    await expect(selector).toBeEnabled();
  }
  expect(await page.evaluate(() => (window as any).subtitleJobs.map((job: any) => job.model))).toEqual(['small', 'medium', 'turbo', 'tiny']);
  await selector.selectOption('small');
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  expect(await page.evaluate(() => (window as any).subtitleJobs.length)).toBe(4);
  await selector.selectOption('turbo');
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  await expect(page.getByLabel('English speech model')).toHaveValue('turbo');
 });

test('all four real Whisper engines transcribe English speech', async ({ page }) => {
  test.skip(!process.env.RUN_ALL_WHISPER_MODELS, 'Opt-in full model integration');
  test.setTimeout(1200000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  for (const model of (process.env.WHISPER_TEST_MODEL ? [process.env.WHISPER_TEST_MODEL] : ['tiny', 'small', 'medium', 'turbo'])) {
    if (model === 'medium' || model === 'turbo') await page.locator('.drop-zone input').setInputFiles(resolve('../shared/subtitles/tests/resume.mp3'));
    await page.getByLabel('English speech model').selectOption(model);
    await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cancel generation' })).toHaveCount(0, { timeout: 900000 });
    await expect(page.getByRole('alert')).toHaveCount(0);
    const text = await page.locator('.subtitle-cue textarea').evaluateAll(inputs => inputs.map(input => (input as HTMLTextAreaElement).value).join(' '));
    expect(text).toMatch(/fellow Americans/i);
    expect(text).toMatch(/country/i);
    if (model === 'medium' || model === 'turbo') {
      const starts = await page.locator('.subtitle-cue input[aria-label$=" start"]').evaluateAll(inputs => inputs.map(input => Number((input as HTMLInputElement).value)));
      expect(Math.max(...starts)).toBeGreaterThan(25);
    }
    console.log(`${model}: ${text}`);
  }
});


test('optional model choices do not fetch speech engines or weights before generation', async ({ page }) => {
  const speechRequests: string[] = [];
  page.on('request', request => {
    if (/huggingface|ggml-worker|\/worker-|ort-wasm|splat-whisper/.test(request.url())) speechRequests.push(request.url());
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Transcribe' }).click();
  await page.locator('.drop-zone input').setInputFiles(resolve('tests/fixtures/speech.mp3'));
  const selector = page.getByLabel('English speech model');
  await expect(selector).toHaveValue('small');
  for (const model of ['turbo', 'local', 'medium', 'small']) await selector.selectOption(model);
  await page.waitForLoadState('networkidle');
  expect(speechRequests).toEqual([]);
});
