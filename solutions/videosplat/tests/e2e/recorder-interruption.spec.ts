import { expect, test } from "@playwright/test";

for (const includeAudio of [true, false]) test(`an unexpected browser recorder stop opens review with audio=${includeAudio}`, async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("videosplat-splash-seen", "1");
    const NativeRecorder = MediaRecorder;
    (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder = class extends NativeRecorder {
      constructor(stream: MediaStream, options?: MediaRecorderOptions) {
        super(stream, options);
        (window as unknown as { testRecorder: MediaRecorder }).testRecorder = this;
      }
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => {
      const audio = new AudioContext();
      const destination = audio.createMediaStreamDestination();
      const oscillator = audio.createOscillator();
      oscillator.connect(destination); oscillator.start();
      await audio.resume();
      return destination.stream;
    } });
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", { value: async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160; canvas.height = 90;
      document.body.append(canvas);
      const context = canvas.getContext("2d")!;
      const stream = canvas.captureStream(15);
      const draw = () => {
        context.fillStyle = `rgb(${Math.floor(Math.random() * 255)},0,0)`;
        context.fillRect(0, 0, canvas.width, canvas.height);
      };
      draw();
      const timer = setInterval(draw, 66);
      stream.getVideoTracks()[0].addEventListener("ended", () => clearInterval(timer));
      return stream;
    } });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Record video", exact: true }).click();
  if (!includeAudio) await page.getByRole("checkbox", { name: "Microphone", exact: true }).uncheck();
  await page.getByLabel("Recording countdown").selectOption("0");
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop and choose crop" })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as unknown as { testRecorder: MediaRecorder }).testRecorder.stop());
  await expect(page.getByRole("alert")).toContainText("browser stopped recording");
  await expect(page.getByRole("button", { name: "Use full recording" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop and choose crop" })).toHaveCount(0);
  await page.getByRole("button", { name: "Use full recording" }).click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(1);
});
