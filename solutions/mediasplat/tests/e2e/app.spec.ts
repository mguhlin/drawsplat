import { expect, test, type Page } from "@playwright/test";
const makeClip = async (page: Page) => Buffer.from(await page.evaluate(async () => {
  const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 54; const context = canvas.getContext("2d")!; const stream = canvas.captureStream(10); const recorder = new MediaRecorder(stream, { mimeType: "video/webm" }); const chunks: Blob[] = [];
  recorder.ondataavailable = event => chunks.push(event.data); recorder.start(); context.fillStyle = "#37d6c0"; context.fillRect(0, 0, 96, 54); await new Promise(resolve => setTimeout(resolve, 700)); recorder.stop(); await new Promise(resolve => recorder.addEventListener("stop", resolve, { once: true })); return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
}));
test("loads locally and exposes all workflows", async ({ page }) => { const external: string[] = []; page.on("request", request => { if (new URL(request.url()).hostname !== "127.0.0.1") external.push(request.url()); }); await page.goto("./"); await expect(page.getByRole("heading", { name: "Cut and combine media without the upload." })).toBeVisible(); await expect(page.getByRole("button", { name: /Local only/ })).toBeVisible(); await expect(page.getByRole("navigation", { name: "Media tools" }).getByRole("button")).toHaveCount(3); expect(external).toEqual([]); });
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
