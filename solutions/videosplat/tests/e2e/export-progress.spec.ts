import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test('export progress survives cancellation and repeated MP4 conversion', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Burn in subtitles…' }).click();
  await page.getByLabel('Subtitle file', { exact: true }).setInputFiles({ name: 'progress.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:00,000 --> 00:00:06,000\nProgress test') });
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export video…' }).click();
  await page.getByLabel('Export processing').selectOption('compatible');
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

for (const failure of ['drawing', 'encoder']) test(`export recovers from ${failure} failure`, async ({page}) => {
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.getByRole('button', {name:'＋ Title',exact:true}).click();
  await page.getByRole('menuitem',{name:'File',exact:true}).click();
  await page.getByRole('menuitem',{name:'Export video…'}).click();
  await page.getByLabel('Export processing').selectOption('compatible');
  await page.getByLabel('Include timeline audio').uncheck();
  await page.evaluate(failure => {
    if(failure==='drawing') CanvasRenderingContext2D.prototype.fillText = () => {throw new Error('Test draw failed')};
    else {
      const start = MediaRecorder.prototype.start;
      MediaRecorder.prototype.start = function(...args) {start.apply(this,args);setTimeout(()=>{if(this.state!=='inactive')this.stop()},100)};
    }
  },failure);
  await page.getByRole('button',{name:'Render local WebM'}).click();
  await expect(page.getByLabel('Export format')).toBeEnabled();
  await expect(page.getByRole('alert')).toContainText(failure==='drawing'?'Test draw failed':'browser stopped exporting early');
});

for (const cancelWhileHidden of [false, true]) test(`compatible export pauses when hidden (${cancelWhileHidden ? 'cancel' : 'resume'})`, async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
  await page.goto('./');
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Burn in subtitles…' }).click();
  await page.getByLabel('Subtitle file', { exact: true }).setInputFiles({ name: 'pause.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:00,000 --> 00:00:04,000\nVisible captions') });
  await page.getByRole('button', { name: 'Add subtitles to timeline' }).click();
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export video…' }).click();
  await page.getByLabel('Export processing').selectOption('compatible');
  await page.getByLabel('Export width').fill('320');
  await page.getByLabel('Export height').fill('180');
  // Include audio to ensure it pauses with video rather than growing a silent tail.
  await page.getByRole('button', { name: 'Render local WebM' }).click();
  await expect.poll(async () => Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(5);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Export paused · return to this tab to continue')).toBeVisible();
  const progress = await page.getByRole('progressbar').getAttribute('aria-valuenow');
  await page.waitForTimeout(2500);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress!);
  if (cancelWhileHidden) {
    await page.getByRole('button', { name: 'Cancel export' }).click();
    await expect(page.getByLabel('Export format')).toBeEnabled();
  } else {
    const pending = page.waitForEvent('download');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const output = await pending;
    const path = await output.path();
    const { execFileSync } = await import('node:child_process');
    const packets = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_packets', '-show_entries', 'packet=stream_index,pts_time', '-of', 'json', path!], { encoding: 'utf8' })).packets;
    for (const index of [0, 1]) {
      const timestamps = packets.filter((packet: any) => packet.stream_index === index).map((packet: any) => Number(packet.pts_time));
      expect(timestamps.length).toBeGreaterThan(10);
      expect(timestamps[0]).toBeLessThan(.2);
      expect(timestamps.at(-1)).toBeLessThan(4.3);
      for (let i = 1; i < timestamps.length; i++) expect(timestamps[i] - timestamps[i - 1]).toBeLessThan(.3);
    }
  }
});
