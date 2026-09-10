import { test, expect } from '@playwright/test';
import { resolve, basename } from 'node:path';

test.use({ serviceWorkers: 'block' });
test('export progress survives cancellation and repeated MP4 conversion', async ({ page, context }) => {
  test.setTimeout(90000);
  await context.route('**/solutions/mediasplat/ffmpeg/**', route => route.fulfill({
    path: resolve('../mediasplat/ffmpeg', basename(new URL(route.request().url()).pathname)),
    headers: { 'Content-Type': route.request().url().endsWith('.js') ? 'text/javascript' : 'application/octet-stream' },
  }));
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Burn in subtitles…' }).click();
  await page.getByLabel('Subtitle file', { exact: true }).setInputFiles({ name: 'progress.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:00,000 --> 00:00:06,000\nProgress test') });
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export video…' }).click();
  await page.getByLabel('Export width').fill('320');
  await page.getByLabel('Export height').fill('180');
  await page.getByLabel('Include timeline audio').uncheck();
  await page.getByRole('button', { name: 'Render local WebM' }).click();
  await expect.poll(async () => Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(10);
  await expect(page.getByLabel('Export format')).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel export' }).click();
  await expect(page.getByLabel('Export format')).toBeEnabled();
  await expect(page.getByText('Stopped', { exact: true })).toBeVisible();
  await page.getByLabel('Export format').selectOption('mp4');
  for (let run = 0; run < 2; run++) {
    const stages: string[] = [];
    await page.exposeFunction(`recordStage${run}`, (label: string) => stages.push(label));
    await page.evaluate(run => {
      const observer = new MutationObserver(() => {
        const label = document.querySelector('.export-progress-heading')?.textContent;
        if (label) (window as any)[`recordStage${run}`](label);
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    }, run);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: run ? 'Render again' : 'Render local MP4' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.mp4$/);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(stages.some(label => label.includes('Rendering timeline'))).toBe(true);
    expect(stages.some(label => label.includes('Converting to MP4'))).toBe(true);
    await expect(page.getByText('Export complete', { exact: true })).toBeVisible();
  }
});
