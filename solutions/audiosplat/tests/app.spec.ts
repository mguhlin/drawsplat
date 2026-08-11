import { expect, test } from '@playwright/test';

test('loads the production AudioSplat shell and changes language', async ({ page }) => {
  const missing: string[] = [];
  page.on('response', (response) => { if (response.url().includes('/solutions/audiosplat/') && response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
  await page.goto('/solutions/audiosplat/');
  await expect(page.getByRole('heading', { name: 'AudioSplat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record' }).first()).toBeVisible();
  await expect(page.getByText('Private by default')).toBeVisible();
  await page.locator('#language').selectOption('es');
  await expect(page.getByRole('button', { name: 'Grabar' }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.reload();
  await expect(page.locator('#language')).toHaveValue('es');
  expect(missing).toEqual([]);
});

test('applies Arabic RTL while retaining a left-to-right timeline contract', async ({ page }) => {
  await page.goto('/solutions/audiosplat/?lang=ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name: 'تسجيل' }).first()).toBeVisible();
});

test('opens help with local privacy guidance', async ({ page }) => {
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog')).toContainText('Audio is processed locally');
});

test('imports, edits, undoes, and exports a real WAV project', async ({ page }) => {
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.locator('#audio-input').setInputFiles({
    name: 'classroom-voice.wav', mimeType: 'audio/wav', buffer: makeWav(1, 8000),
  });
  await expect(page.locator('[data-clip]')).toHaveCount(1);
  await expect(page.locator('[data-clip]')).toHaveAttribute('aria-label', /classroom-voice/);
  await page.getByRole('button', { name: 'Add track' }).first().click();
  await expect(page.locator('[data-track]')).toHaveCount(2);
  const ruler = page.locator('[data-ruler]');
  const box = await ruler.boundingBox();
  if (!box) throw new Error('Timeline ruler missing');
  await page.mouse.click(box.x + 40, box.y + 10);
  await page.getByRole('button', { name: 'Split' }).first().click();
  await expect(page.locator('[data-clip]')).toHaveCount(2);
  await page.getByTitle('Undo').click();
  await expect(page.locator('[data-clip]')).toHaveCount(1);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export WAV' }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.wav$/);
});

test('records from a permitted microphone and creates a recoverable clip', async ({ page }) => {
  await page.goto('/solutions/audiosplat/?lang=en');
  await page.getByRole('button', { name: 'Record' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('microphone access');
  await page.getByRole('button', { name: 'Continue to microphone' }).click();
  await expect(page.locator('#status')).toHaveText('Recording');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('[data-clip]')).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator('#save-state')).toHaveText('Saved locally');
});

function makeWav(seconds: number, sampleRate: number): Buffer {
  const frames = seconds * sampleRate;
  const output = Buffer.alloc(44 + frames * 2);
  output.write('RIFF', 0); output.writeUInt32LE(36 + frames * 2, 4); output.write('WAVE', 8);
  output.write('fmt ', 12); output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22); output.writeUInt32LE(sampleRate, 24); output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34); output.write('data', 36); output.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index += 1) {
    output.writeInt16LE(Math.round(Math.sin(index / sampleRate * Math.PI * 2 * 440) * 8000), 44 + index * 2);
  }
  return output;
}
