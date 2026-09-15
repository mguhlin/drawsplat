import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { fakeTranscriber } from '../../../shared/subtitles/tests/browser';

async function simulateExistingWorker(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('videosplat-splash-seen', '1');
    sessionStorage.setItem('updateTestLoads', String(Number(sessionStorage.getItem('updateTestLoads') || 0) + 1));
    const workers = Object.assign(new EventTarget(), {
      controller: {},
      register: async () => ({ update: async () => {} }),
    });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: workers });
  });
}

test('worker activation does not reload or discard an active recording', async ({ page }) => {
  await simulateExistingWorker(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: async () => {
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
      const context = canvas.getContext('2d')!;
      context.fillRect(0, 0, 160, 90);
      const stream = canvas.captureStream(10);
      const timer = setInterval(() => context.fillRect(0, 0, 160, 90), 100);
      const track = stream.getVideoTracks()[0], stop = track.stop.bind(track);
      track.stop = () => { clearInterval(timer); stop(); };
      return stream;
    } });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Record video', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Microphone', exact: true }).uncheck();
  await page.getByLabel('Recording countdown').selectOption('0');
  await page.getByRole('button', { name: 'Start recording', exact: true }).click();
  const stop = page.getByRole('button', { name: 'Stop and choose crop', exact: true });
  await expect(stop).toBeVisible();
  await page.waitForTimeout(1500);
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => sessionStorage.getItem('updateTestLoads'))).toBe('1');
  await expect(stop).toBeVisible();
  await stop.click();
  await page.getByRole('button', { name: 'Use full recording', exact: true }).click();
  await expect(page.locator('.timeline-clip.video')).toHaveCount(1);
  expect(Number(await page.getByLabel('Clip duration', { exact: true }).inputValue())).toBeGreaterThan(2.5);
});

test('worker activation leaves running subtitle generation and cancel controls intact', async ({ page }) => {
  await fakeTranscriber(page, 10000);
  await simulateExistingWorker(page);
  await page.goto('./');
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles(resolve('../shared/subtitles/tests/speech.mp4'));
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate subtitles…', exact: true }).click();
  await page.getByRole('button', { name: 'Generate subtitles', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).subtitleJobs.length)).toBe(1);
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => sessionStorage.getItem('updateTestLoads'))).toBe('1');
  await page.getByRole('button', { name: 'Cancel generation', exact: true }).click();
  expect(await page.evaluate(() => (window as any).subtitleTerminated)).toBe(true);
  await page.getByRole('button', { name: 'Close subtitle generation' }).click();
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
});

test('offline worker registration failure leaves the editor usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await simulateExistingWorker(page);
  await page.addInitScript(() => {
    navigator.serviceWorker.register = async () => { throw new Error('Offline worker unavailable'); };
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Record video', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start recording', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
