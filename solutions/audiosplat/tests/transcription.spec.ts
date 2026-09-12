import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fakeTranscriber, silentWav } from '../../shared/subtitles/tests/browser';
test.beforeEach(async ({ page }) => {
  const headers = await readFile(resolve('../../_headers'), 'utf8');
  const policy = headers.split('/solutions/audiosplat/*')[1].split('\n').find(line => line.trim().startsWith('Content-Security-Policy:'))!.trim().slice('Content-Security-Policy:'.length).trim();
  await page.route('**/solutions/audiosplat/**', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
  });
});
const fixture = (extension: string) => resolve(`../mediasplat/tests/fixtures/speech.${extension}`);
async function openTranscription(page: Page) {
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.locator('summary').filter({ hasText: /^File$/ }).click();
  await page.getByRole('button', { name: 'Transcribe audio…', exact: true }).click();
}
for (const extension of ['mp3', 'ogg', 'm4a']) {
  test(`transcribes ${extension} with reviewed SRT and text downloads`, async ({ page }) => {
    await fakeTranscriber(page);
    await openTranscription(page);
    await page.getByLabel('Audio file for transcription').setInputFiles(fixture(extension));
    await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
    await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
    await page.getByLabel('Caption 1 text').fill('Reviewed audio');
    for (const [label, suffix] of [['Download SRT', 'srt'], ['Download transcript (.txt)', 'txt']]) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: label, exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(`speech.${suffix}`);
      const contents = await readFile((await download.path())!, 'utf8');
      if (suffix === 'srt') { expect(contents).toContain('Reviewed audio'); expect(contents).toContain('00:00:00,200 --> 00:00:01,200'); }
      else expect(contents).toBe('Reviewed audio\n\nReview this caption\n');
    }
    await page.getByLabel('Audio file for transcription').setInputFiles({ name: 'replacement.mp3', mimeType: 'audio/mpeg', buffer: await readFile(fixture('mp3')) });
    await expect(page.getByLabel('Caption 1 text')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Download SRT' })).toBeHidden();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.clip')).toHaveCount(0);
  });
}
test('cancel and closing abort recognition without editor shortcuts firing', async ({ page }) => {
  await fakeTranscriber(page, 10000);
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(fixture('mp3'));
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('cancelled');
  await page.evaluate(() => { (window as any).subtitleTerminated = false; });
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(2);
  await page.getByRole('button', { name: 'Cancel generation' }).focus();
  await page.keyboard.press('r');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
});
test('reports invalid audio and validates edited timestamps', async ({ page }) => {
  await fakeTranscriber(page);
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles({ name: 'silent.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('This audio is silent');
  await page.getByLabel('Audio file for transcription').setInputFiles(fixture('mp3'));
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toBeVisible();
  await page.getByLabel('Caption 1 end').fill('0');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
});
test('real speech engine exports an audio transcript', async ({ page }) => {
  test.skip(!process.env.RUN_SPEECH_MODEL_TESTS, 'Opt-in model download');
  test.setTimeout(180000);
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(fixture('mp3'));
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue(/fellow Americans/i, { timeout: 120000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download transcript (.txt)' }).click();
  expect(await readFile((await (await pending).path())!, 'utf8')).toMatch(/fellow Americans/i);
});

test('keeps partial downloads and resumes generated progress after closing and reloading', async ({ page }) => {
  await fakeTranscriber(page, 1500);
  const longFile = resolve('../shared/subtitles/tests/resume.mp3');
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(longFile);
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toBeVisible({ timeout: 15000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download transcript (.txt)' }).click();
  expect((await pending).suggestedFilename()).toBe('resume.partial.txt');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(longFile);
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByText(/^Complete transcript/)).toBeVisible({ timeout: 20000 });
  const completed = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const download = await completed;
  expect(download.suggestedFilename()).toBe('resume.srt');
  const contents = await readFile((await download.path())!, 'utf8');
  expect(contents.match(/00:00:00,200/g)).toHaveLength(1);
  await expect(page.getByRole('button', { name: 'Start over', exact: true })).toBeVisible();
});

 test('selects models, isolates saved transcripts and remembers the choice', async ({ page }) => {
  await fakeTranscriber(page, 500);
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(fixture('mp3'));
  const selector = page.getByLabel('English speech model');
  await expect(selector).toHaveValue('small');
  for (const model of ['small', 'medium', 'tiny']) {
    await selector.selectOption(model);
    await expect(page.getByLabel('Caption 1 text')).toHaveCount(0);
    await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
    await expect(selector).toBeDisabled();
    await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
    await expect(selector).toBeEnabled();
  }
  expect(await page.evaluate(() => (window as any).subtitleJobs.map((job: any) => job.model))).toEqual(['small', 'medium', 'tiny']);
  await selector.selectOption('small');
  await page.getByRole('button', { name: 'Generate transcript', exact: true }).click();
  await expect(page.getByLabel('Caption 1 text')).toHaveValue('Generated speech');
  expect(await page.evaluate(() => (window as any).subtitleJobs.length)).toBe(3);
  await selector.selectOption('medium');
  await openTranscription(page);
  await page.getByLabel('Audio file for transcription').setInputFiles(fixture('mp3'));
  await expect(page.getByLabel('English speech model')).toHaveValue('medium');
 });
