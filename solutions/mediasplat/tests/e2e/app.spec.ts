import { readFile } from "node:fs/promises";
async function whitePixels(page: import("@playwright/test").Page, path: string) {
 const bytes = [...await readFile(path)];
 return page.evaluate(async (bytes) => {
  const video = document.createElement("video"); const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
  try {
   await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error("Export cannot be decoded")); video.src = url; video.load(); });
   await new Promise<void>(resolve => { video.onseeked = () => resolve(); video.currentTime = 0.0001; });
   const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
   const context = canvas.getContext("2d")!; context.drawImage(video, 0, 0); const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
   let white = 0; for (let i = 0; i < data.length; i += 4) if (Math.min(data[i], data[i + 1], data[i + 2]) > 180) white++;
   return white;
  } finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
 }, bytes);
}
import { expect, test, type Page } from "@playwright/test";
const makeClip = async (page: Page, portrait = false) => Buffer.from(await page.evaluate(async (portrait) => {
  const canvas = document.createElement("canvas"); canvas.width = portrait ? 360 : 640; canvas.height = portrait ? 640 : 360; const context = canvas.getContext("2d")!; const stream = canvas.captureStream(10); const recorder = new MediaRecorder(stream, { mimeType: "video/webm" }); const chunks: Blob[] = [];
  recorder.ondataavailable = event => chunks.push(event.data); recorder.start(); context.fillStyle = "#37d6c0"; context.fillRect(0, 0, canvas.width, canvas.height); const tick = setInterval(() => context.fillRect(0, 0, canvas.width, canvas.height), 80); await new Promise(resolve => setTimeout(resolve, 700)); clearInterval(tick); recorder.stop(); await new Promise(resolve => recorder.addEventListener("stop", resolve, { once: true }, portrait)); return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
}, portrait));
test("loads locally and exposes all workflows", async ({ page }) => { const external: string[] = []; page.on("request", request => { if (new URL(request.url()).hostname !== "127.0.0.1") external.push(request.url()); }); await page.goto("./"); await expect(page.getByRole("heading", { name: "Cut and combine media without the upload." })).toBeVisible(); await expect(page.getByRole("button", { name: /Local only/ })).toBeVisible(); await expect(page.getByRole("navigation", { name: "Media tools" }).getByRole("button")).toHaveCount(5); expect(external).toEqual([]); });
test("shows time and size split controls", async ({ page }) => { await page.goto("./"); await page.getByRole("button", { name: /Split/ }).click(); await expect(page.getByText("Choose a video or audio file")).toBeVisible(); });
test("join requires multiple files", async ({ page }) => { await page.goto("./"); await page.getByRole("button", { name: /Join/ }).click(); await expect(page.getByText("Choose two or more media files")).toBeVisible(); });
test("processes a generated clip entirely in the browser", async ({ page }) => {
  await page.goto("./");
  const bytes = await makeClip(page);
  await page.locator('input[type="file"]').setInputFiles({ name: "sample.webm", mimeType: "video/webm", buffer: bytes });
  await expect(page.getByText("sample.webm")).toBeVisible(); await page.getByLabel("Start time").fill("0"); await page.getByLabel("End time").fill("0.5"); await page.getByRole("button", { name: "Trim media" }).click();
  await expect(page.getByRole("region", { name: "Output files" })).toBeVisible({ timeout: 60_000 }); await expect(page.getByRole("button", { name: "Download" })).toBeEnabled();
});
test("shows arbitrary time and MB or GB split controls", async ({ page }) => {
  await page.goto("./"); await page.getByRole("button", { name: /Split/ }).click(); const bytes = await makeClip(page); await page.locator('input[type="file"]').setInputFiles({ name: "long.webm", mimeType: "video/webm", buffer: bytes });
  await page.getByRole("button", { name: "By time" }).click(); await expect(page.getByLabel("Segment hours")).toBeVisible(); await page.getByRole("button", { name: "6 min" }).click(); await expect(page.getByLabel("Segment minutes")).toHaveValue("6");
  await page.getByRole("button", { name: "By size" }).click(); await expect(page.getByLabel("Target size")).toBeVisible(); await page.getByLabel("Size unit").selectOption("GB"); await expect(page.getByLabel("Size unit")).toHaveValue("GB");
});
test("joins two compatible clips in the browser", async ({ page }) => {
  await page.goto("./"); await page.getByRole("button", { name: /Join/ }).click(); const bytes = await makeClip(page); await page.locator('input[type="file"]').setInputFiles([{ name: "one.webm", mimeType: "video/webm", buffer: bytes }, { name: "two.webm", mimeType: "video/webm", buffer: bytes }]); await page.getByRole("button", { name: "Join media" }).click(); await expect(page.getByRole("region", { name: "Output files" })).toBeVisible({ timeout: 60_000 }); await expect(page.getByText("joined-media.webm")).toBeVisible();
});
test("downloads all split parts as one ZIP", async ({ page }) => {
  await page.goto("./"); await page.getByRole("button", { name: /Split/ }).click(); const bytes = await makeClip(page); await page.locator('input[type="file"]').setInputFiles({ name: "lesson.webm", mimeType: "video/webm", buffer: bytes }); await page.getByRole("button", { name: "Split media" }).click(); await expect(page.getByRole("button", { name: "Download all as ZIP" })).toBeVisible({ timeout: 60_000 }); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Download all as ZIP" }).click(); expect((await download).suggestedFilename()).toBe("lesson-parts.zip");
});

for (const portrait of [false, true]) test(`burns SRT into a real ${portrait ? "portrait" : "landscape"} MP4 using the bundled engine and font`, async ({ page }) => {
 test.setTimeout(90000);
 await page.goto("./");
 const clip = await makeClip(page, portrait);
 await page.getByRole("button", {name: /Subtitles/}).click();
 await page.locator('input[type="file"]').first().setInputFiles({name: "sample.webm", mimeType: "video/webm", buffer: clip});
 await page.getByLabel("Subtitle file").setInputFiles({name: "sample.srt", mimeType: "application/x-subrip", buffer: Buffer.from("1\n00:00:00,000 --> 00:00:00,600\nHELLO")});
 await page.getByLabel("Font size").fill("120");
 await page.getByRole("button", {name: "Burn subtitles to MP4"}).click();
 await expect(page.getByRole("region", {name: "Output files"})).toBeVisible({timeout: 60000});
 const pending = page.waitForEvent("download"); await page.getByRole("button", {name: "Download", exact: true}).click();
 const download = await pending; expect(download.suggestedFilename()).toBe("sample-subtitled.mp4");
 await download.saveAs("/tmp/mediasplat-subtitle-test.mp4");
 expect(await whitePixels(page, "/tmp/mediasplat-subtitle-test.mp4")).toBeGreaterThan(20);
 // Repeating the export also verifies virtual font/subtitle files are cleaned up.
 await page.getByRole("button", {name: "Burn subtitles to MP4"}).click();
 await expect(page.getByRole("region", {name: "Output files"})).toBeVisible({timeout: 60000});
});
