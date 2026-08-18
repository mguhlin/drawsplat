import { expect, test } from "@playwright/test";

test("loads the local-first editor without external requests", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(request.url());
  });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Local only" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Timeline" })).toBeVisible();
  expect(external).toEqual([]);
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
  await page.getByLabel("Scale").fill("0.5");
  await page.getByLabel("Opacity").fill("0.6");
  await expect(page.locator(".visual-layer")).toHaveCSS("opacity", "0.6");
  await expect(page.locator(".visual-layer")).toHaveAttribute(
    "style",
    /translate\(24px, 0px\) scale\(0.5\)/,
  );
});
