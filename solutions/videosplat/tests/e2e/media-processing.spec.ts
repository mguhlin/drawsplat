import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("videosplat-splash-seen", "1"));
});

test("optimized video retains sound and its full duration", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.getByRole("menuitem", { name: "File", exact: true }).click();
  await page.getByRole("menuitem", { name: "Optimize video…" }).click();
  await page.locator('input[accept="video/*"]').setInputFiles(resolve("tests/fixtures/tone.webm"));
  await page.getByRole("button", { name: "Create optimized copy" }).click();
  await expect(page.getByRole("button", { name: "Download copy" })).toBeVisible({ timeout: 15000 });
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download copy" }).click();
  const path = testInfo.outputPath("optimized.webm");
  await (await pending).saveAs(path);
  const bytes = [...await readFile(path)];
  const audio = await page.evaluate(async (bytes) => {
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(new Uint8Array(bytes).buffer);
      const samples = decoded.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) sum += samples[i] ** 2;
      return { duration: decoded.duration, rms: Math.sqrt(sum / samples.length) };
    } finally { await context.close(); }
  }, bytes);
  expect(audio.duration).toBeGreaterThan(1.7);
  expect(audio.duration).toBeLessThan(3);
  expect(audio.rms).toBeGreaterThan(.02);
});

test("closing the optimizer cancels encoding and releases its tracks", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeRecorder = MediaRecorder;
    (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder = class extends NativeRecorder {
      constructor(stream: MediaStream, options?: MediaRecorderOptions) {
        super(stream, options);
        (window as unknown as { testRecorder: MediaRecorder }).testRecorder = this;
      }
    };
  });
  await page.goto("./");
  await page.getByRole("menuitem", { name: "File", exact: true }).click();
  await page.getByRole("menuitem", { name: "Optimize video…" }).click();
  await page.locator('input[accept="video/*"]').setInputFiles(resolve("tests/fixtures/tone.webm"));
  await page.getByRole("button", { name: "Create optimized copy" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { testRecorder?: MediaRecorder }).testRecorder?.state)).toBe("recording");
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const recorder = (window as unknown as { testRecorder: MediaRecorder }).testRecorder;
    return { state: recorder.state, tracks: recorder.stream.getTracks().every(track => track.readyState === "ended") };
  }), { timeout: 1000 }).toEqual({ state: "inactive", tracks: true });
});

test('closing a crop stops its encoder and never adds a late clip', async ({page}) => {
  await page.addInitScript(()=>{
    sessionStorage.setItem('videosplat-splash-seen','1');
    const start=MediaRecorder.prototype.start;
    MediaRecorder.prototype.start=function(...args){(window as any).lastCropRecorder=this;start.apply(this,args)};
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
      const ctx=canvas.getContext('2d')!;ctx.fillStyle='red';ctx.fillRect(0,0,160,90);
      const stream=canvas.captureStream(10);
      const timer=setInterval(()=>{if(stream.getTracks()[0].readyState==='ended')clearInterval(timer);else ctx.fillRect(0,0,160,90)},100);
      return stream;
    }});
  });
  await page.goto('./');
  await page.getByRole('button',{name:'Record video',exact:true}).click();
  await page.getByLabel('Recording source').selectOption('camera');
  await page.getByRole('checkbox',{name:'Microphone',exact:true}).uncheck();
  await page.getByLabel('Recording countdown').selectOption('0');
  await page.getByRole('button',{name:'Start recording',exact:true}).click();
  await expect(page.getByRole('button',{name:'Stop and choose crop'})).toBeVisible();
  await page.waitForTimeout(1600);
  await page.getByRole('button',{name:'Stop and choose crop'}).click();
  await page.getByRole('button', { name: 'Center', exact: true }).click();
  await page.getByRole('button',{name:'Crop and add to timeline'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).lastCropRecorder.state)).toBe('recording');
  await page.getByRole('button',{name:'Close recorder'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).lastCropRecorder.state)).toBe('inactive');
  await expect.poll(()=>page.evaluate(()=>(window as any).lastCropRecorder.stream.getTracks().every((t:MediaStreamTrack)=>t.readyState==='ended'))).toBe(true);
  await page.waitForTimeout(1800);
  await expect(page.locator('.timeline-clip')).toHaveCount(0);
  await expect(page.locator('body > video[aria-hidden="true"]')).toHaveCount(0);
});
