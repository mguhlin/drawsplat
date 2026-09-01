import { expect, test, type Page } from "@playwright/test";

const createTestVideo = async (page: Page) =>
  Buffer.from(
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const context = canvas.getContext("2d")!;
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.start();
      context.fillStyle = "#d62424";
      context.fillRect(0, 0, 160, 90);
      await new Promise((resolve) => setTimeout(resolve, 250));
      context.fillStyle = "#246bd6";
      context.fillRect(0, 0, 160, 90);
      await new Promise((resolve) => setTimeout(resolve, 250));
      recorder.stop();
      await new Promise((resolve) =>
        recorder.addEventListener("stop", resolve, { once: true }),
      );
      return Array.from(
        new Uint8Array(
          await new Blob(chunks, { type: "video/webm" }).arrayBuffer(),
        ),
      );
    }),
  );

test.beforeEach(async ({ page }, testInfo) => {
  if (
    !testInfo.title.startsWith("loads the local-first editor") &&
    !testInfo.title.startsWith("can request camera")
  )
    await page.addInitScript(() =>
      sessionStorage.setItem("videosplat-splash-seen", "1"),
    );
});

test("loads the local-first editor without external requests", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(request.url());
  });
  await page.goto("./");
  await expect(page.getByLabel("VideoSplat loading")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "VideoSplat™" }),
  ).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page.getByLabel("VideoSplat loading")).toBeVisible();
  await page.getByRole("button", { name: "Edit without recording setup" }).click();
  await expect(page.getByLabel("VideoSplat loading")).toBeHidden();
  await expect(page.getByRole("button", { name: "Local only" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create a new VideoSplat project" }),
  ).toContainText("VideoSplat™");
  await expect(page.getByRole("region", { name: "Timeline" })).toBeVisible();
  expect(external).toEqual([]);
});

test("can request camera and microphone setup from the splash", async ({ page }) => {
  await page.addInitScript(() => {
    const stopped: string[] = [];
    Object.defineProperty(window, "__stoppedSetupTracks", { value: stopped });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => Promise.resolve({
          getTracks: () => [
            { stop: () => stopped.push("video") },
            { stop: () => stopped.push("audio") },
          ],
        }),
        enumerateDevices: () => Promise.resolve([
          { kind: "audioinput", deviceId: "headset", label: "USB Headset Microphone" },
        ]),
      },
    });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Set up recording permissions" }).click();
  await expect(page.getByLabel("Splash microphone source")).toHaveValue("headset");
  await page.getByRole("button", { name: "Continue with selected microphone" }).click();
  await expect(page.getByRole("heading", { name: "Record locally" })).toBeVisible();
  await expect(page.getByText("Camera and microphone ready for this session")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __stoppedSetupTracks: string[] }).__stoppedSetupTracks)).toEqual(["video", "audio"]);
});

test("keeps toolbar labels and the project inspector inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("./");

  const toolbar = page.getByRole("navigation", { name: "Editor tools" });
  const importButton = page.getByRole("button", { name: "Import media" });
  const inspector = page.locator(".inspector");

  await expect(toolbar).toBeVisible();
  await expect(page.locator(".topbar").getByRole("button", { name: "Export video" })).toBeVisible();
  await expect(page.locator(".topbar").getByRole("button", { name: "Shortcuts" })).toBeVisible();
  await page.setViewportSize({ width: 1920, height: 900 });
  const finalToolbarButton = toolbar.getByRole("button", { name: "Save MLT" });
  await expect(finalToolbarButton).toBeVisible();
  expect(
    await finalToolbarButton.evaluate(
      (element) => element.getBoundingClientRect().right <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(importButton).toHaveCSS("white-space", "nowrap");
  await expect(inspector).toBeVisible();
  expect(
    await inspector.evaluate(
      (element) => element.getBoundingClientRect().right <= window.innerWidth,
    ),
  ).toBe(true);
});

test("opens the private recorder and handles denied permission", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: () =>
          Promise.reject(new DOMException("Denied", "NotAllowedError")),
        getUserMedia: () =>
          Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record locally" })).toBeVisible();
  await expect(page.getByText("the recording is not uploaded")).toBeVisible();
  await page.getByLabel("Recording countdown").selectOption("0");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByRole("alert")).toContainText("permission was not granted");
});

test("keeps recorder setup controls visible on a short screen", async ({ page }) => {
  await page.setViewportSize({ width: 655, height: 894 });
  await page.goto("./");
  await page.getByRole("button", { name: "Record", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record locally" });
  await expect(page.getByRole("button", { name: /Browser tab/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Application window/ }).click();
  await expect(page.getByRole("button", { name: /Application window/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Start recording" })).toBeVisible();
  expect(
    await dialog.evaluate((element) => element.scrollHeight <= element.clientHeight),
  ).toBe(true);
});

test("reloads offline and supports keyboard dialog dismissal", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator('[role="status"]')).toBeVisible();
  await page.getByRole("button", { name: "Local only" }).click();
  await expect(
    page.getByRole("heading", { name: "Privacy & device storage" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Privacy & device storage" }),
  ).toBeHidden();
  // The first navigation installs the worker; the next is controlled by it.
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Local only" })).toBeVisible();
});

test("renames, autosaves, and exposes privacy details", async ({ page }) => {
  await page.goto("./");
  const name = page.getByLabel("Project name");
  await name.fill("Private interview");
  await expect(page.getByText("Autosaved locally")).toBeVisible();
  await page.getByRole("button", { name: "Local only" }).click();
  await expect(
    page.getByRole("heading", { name: "Privacy & device storage" }),
  ).toBeVisible();
  await expect(page.getByText("Same-origin app files only")).toBeVisible();
});

test("imports an image locally and places it on the timeline", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "private-frame.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#7467ff"/></svg>',
    ),
  });
  await expect(
    page.getByText("1 media file imported and stored locally"),
  ).toBeVisible();
  await expect(page.getByText("private-frame.svg").first()).toBeVisible();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.locator(".visual-layer > img")).toBeVisible();
});

test("fits, fills, or stretches visual clips in the preview", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "portrait.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640"><rect width="360" height="640" fill="#7467ff"/></svg>',
    ),
  });

  const preview = page.locator(".visual-layer > img");
  await expect(preview).toHaveCSS("object-fit", "contain");
  await page.getByLabel("Frame fit").selectOption("fill");
  await expect(preview).toHaveCSS("object-fit", "cover");
  await page.getByLabel("Frame fit").selectOption("stretch");
  await expect(preview).toHaveCSS("object-fit", "fill");
});

test("seeks a newly mounted video preview after metadata loads", async ({
  page,
}) => {
  await page.goto("./");
  const video = await createTestVideo(page);
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "preview.webm",
    mimeType: "video/webm",
    buffer: video,
  });
  await page.getByLabel("Timeline start").fill("1");
  const timelineClip = page.locator(".timeline-clip").first();
  const clipBox = await timelineClip.boundingBox();
  await timelineClip.click({
    position: { x: Math.max(2, clipBox!.width * 0.6), y: 20 },
  });
  const preview = page.locator(".visual-layer > video");
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((element) => element.currentTime))
    .toBeGreaterThan(0.05);
  await expect
    .poll(() => preview.evaluate((element) => element.readyState))
    .toBeGreaterThanOrEqual(2);
});

test("recovers the real duration of browser-recorded WebM media", async ({ page }) => {
  await page.goto("./");
  const video = await createTestVideo(page);
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "browser-recording.webm",
    mimeType: "video/webm",
    buffer: video,
  });
  const duration = Number(await page.getByLabel("Clip duration").inputValue());
  expect(duration).toBeGreaterThan(0.1);
  expect(duration).toBeLessThan(2);
});

test("splits, duplicates, trims, and deletes timeline clips", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "scene.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#222"/></svg>',
    ),
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.locator(".ruler").click({ position: { x: 84, y: 15 } });
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await page
    .getByRole("navigation", { name: "Editor tools" })
    .getByRole("button", { name: "Duplicate" })
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  await page.getByLabel("Clip duration").fill("1.5");
  await expect(page.getByLabel("Clip duration")).toHaveValue("1.5");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
});

test("opens the offline video optimizer", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Optimize video" }).click();
  await expect(
    page.getByRole("heading", { name: "Optimize video locally" }),
  ).toBeVisible();
  await expect(
    page.getByText("without uploading or changing the original"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create optimized copy" }),
  ).toBeDisabled();
});

test("moves, trims, and inserts clips directly on the timeline", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "movable.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#246"/></svg>',
    ),
  });
  const clip = page.locator(".timeline-clip").first();
  await clip.click({ position: { x: 100, y: 25 } });
  await expect(page.getByText(/Previewing movable.svg at/)).toBeVisible();
  await clip.hover();
  await page.mouse.down();
  await page.mouse.move(
    (await clip.boundingBox())!.x + 130,
    (await clip.boundingBox())!.y + 25,
  );
  await page.mouse.up();
  await expect(page.getByLabel("Timeline start")).not.toHaveValue("0");
  const before = await page.getByLabel("Clip duration").inputValue();
  const right = clip.locator(".trim-handle.right");
  const box = await right.boundingBox();
  await page.mouse.move(box!.x + 2, box!.y + 20);
  await page.mouse.down();
  await page.mouse.move(box!.x - 40, box!.y + 20);
  await page.mouse.up();
  await expect(page.getByLabel("Clip duration")).not.toHaveValue(before);
  await page
    .getByRole("button", { name: "Insert movable.svg at playhead" })
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await expect(page.getByText("later clips moved right")).toBeVisible();
});

test("respects timeline gaps and exposes precision controls", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "delayed.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#135"/></svg>',
    ),
  });
  await page.getByLabel("Timeline start").fill("2");
  await page.locator(".ruler").click({ position: { x: 1, y: 15 } });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByText("Timeline gap")).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Next frame" }).click();
  await page.getByRole("button", { name: "Add video track" }).click();
  await expect(page.locator(".track")).toHaveCount(3);
  await page.getByLabel("Rename Video 2").fill("Overlay");
  await page.getByRole("button", { name: "Move Overlay up" }).click();
  await page.getByRole("button", { name: "Remove Overlay" }).click();
  await expect(page.locator(".track")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Snap on" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("imports MLT XML locally and reports blocked resources", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept*=".mlt"]').setInputFiles({
    name: "remote.mlt",
    mimeType: "application/xml",
    buffer: Buffer.from(
      '<mlt title="MLT test"><profile width="1280" height="720" frame_rate_num="30" frame_rate_den="1"/><producer id="p"><property name="resource">https://example.com/private.mp4</property></producer><playlist id="v"><entry producer="p" in="0" out="29"/></playlist></mlt>',
    ),
  });
  await expect(
    page.getByText("MLT opened locally with 2 warnings"),
  ).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("MLT test");
});

test("supports clipboard edits and ripple or lift deletion", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "clipboard.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>',
    ),
  });
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await expect(page.getByText("pasted using insert edit")).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("track gap closed")).toBeVisible();
  await page.getByRole("button", { name: "Ripple on" }).click();
  await expect(
    page.getByRole("button", { name: "Ripple off" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("selects a clip waveform range and pastes only that section", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "range.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>',
    ),
  });
  await page.getByRole("button", { name: "Range select off" }).click();
  const clip = page.locator(".timeline-clip").first();
  const box = await clip.boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.2, box!.y + 25);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.6, box!.y + 25);
  await page.mouse.up();
  await expect(page.locator(".clip-range-selection")).toBeVisible();
  await expect(page.getByText(/second range selected/)).toBeVisible();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.locator(".ruler").click({ position: { x: 250, y: 15 } });
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await expect(page.getByLabel("Clip duration")).toHaveValue("2");
});

test("applies clip transforms in the layered preview", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "overlay.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="red"/></svg>',
    ),
  });
  await page.getByLabel("X position").fill("24");
  await page.getByLabel("Scale", { exact: true }).fill("0.5");
  await page.getByLabel("Opacity").fill("0.6");
  await expect(page.locator(".visual-layer")).toHaveCSS("opacity", "0.6");
  await expect(page.locator(".visual-layer")).toHaveAttribute(
    "style",
    /translate\(24px, 0px\) scale\(0.5\)/,
  );
});

test("creates titles with transitions and visual effects", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Title" }).click();
  await page.getByLabel("Title text").fill("Private local title");
  await page.getByLabel("Font size").fill("48");
  await page.getByLabel("Transition in").fill("1");
  await page.getByLabel("Brightness").fill("0.8");
  await page.getByLabel("Blur").fill("2");
  await expect(page.locator(".title-layer")).toHaveText("Private local title");
  await expect(page.locator(".title-layer")).toHaveCSS("font-size", "48px");
  await expect(page.locator(".visual-layer")).toHaveAttribute(
    "style",
    /brightness\(0.8\).*blur\(2px\)/,
  );
  await expect(page.locator(".timeline-clip.text")).toHaveCount(1);
});

test("imports captions and exposes the local composition exporter", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('input[accept*=".srt"]').setInputFiles({
    name: "local.srt",
    mimeType: "application/x-subrip",
    buffer: Buffer.from("1\n00:00:00,000 --> 00:00:02,000\nLocal caption"),
  });
  await expect(page.getByText("local.srt imported locally")).toBeVisible();
  await expect(page.locator(".title-layer")).toHaveText("Local caption");
  await expect(page.locator(".timeline-clip.caption")).toHaveCount(1);
  await page.getByRole("button", { name: "Export video" }).click();
  await expect(
    page.getByRole("heading", { name: "Export video locally" }),
  ).toBeVisible();
  await expect(page.getByText("Media is not uploaded")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Render local WebM" }),
  ).toBeEnabled();
  await page.getByLabel("Export format").selectOption("mp4");
  await expect(page.getByRole("button", { name: "Render local MP4" })).toBeVisible();
  await page.getByLabel("Export format").selectOption("ogm");
  await expect(page.getByRole("button", { name: "Render local OGM" })).toBeVisible();
  await page.getByLabel("Export format").selectOption("webm");
  await page.getByLabel("Export width").fill("160");
  await page.getByLabel("Export height").fill("90");
  await page.getByLabel("Export frame rate").fill("10");
  await page.getByText("Include timeline audio").click();
  await page.getByRole("button", { name: "Render local WebM" }).click();
  await expect(page.getByText("Saved to your Downloads folder")).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByRole("button", { name: "Save another WebM copy" }),
  ).toBeVisible();
});
