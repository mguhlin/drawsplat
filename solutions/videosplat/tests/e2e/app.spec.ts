import { expect, test } from "@playwright/test";

test("loads the local-first editor without external requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => { const url = new URL(request.url()); if (url.hostname !== "127.0.0.1") external.push(request.url()); });
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
  await expect(page.getByRole("heading", { name: "Privacy & device storage" })).toBeVisible();
  await expect(page.getByText("Same-origin app files only")).toBeVisible();
});

test("imports an image locally and places it on the timeline", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "private-frame.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#7467ff"/></svg>'),
  });
  await expect(page.getByText("1 media file imported and stored locally")).toBeVisible();
  await expect(page.getByText("private-frame.svg").first()).toBeVisible();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.locator(".canvas > img")).toBeVisible();
});

test("splits, duplicates, trims, and deletes timeline clips", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({ name: "scene.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#222"/></svg>') });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.locator(".ruler").click({ position: { x: 84, y: 15 } });
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await page.getByRole("navigation", { name: "Editor tools" }).getByRole("button", { name: "Duplicate" }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  await page.getByLabel("Clip duration").fill("1.5");
  await expect(page.getByLabel("Clip duration")).toHaveValue("1.5");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
});

test("opens the offline video optimizer", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Optimize video" }).click();
  await expect(page.getByRole("heading", { name: "Optimize video locally" })).toBeVisible();
  await expect(page.getByText("without uploading or changing the original")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create optimized copy" })).toBeDisabled();
});

test("moves, trims, and inserts clips directly on the timeline", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({ name: "movable.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#246"/></svg>') });
  const clip = page.locator(".timeline-clip").first();
  await clip.click({ position: { x: 100, y: 25 } });
  await expect(page.getByText(/Previewing movable.svg at/)).toBeVisible();
  await clip.hover();
  await page.mouse.down(); await page.mouse.move((await clip.boundingBox())!.x + 130, (await clip.boundingBox())!.y + 25); await page.mouse.up();
  await expect(page.getByLabel("Timeline start")).not.toHaveValue("0");
  const before = await page.getByLabel("Clip duration").inputValue();
  const right = clip.locator(".trim-handle.right"); const box = await right.boundingBox();
  await page.mouse.move(box!.x + 2, box!.y + 20); await page.mouse.down(); await page.mouse.move(box!.x - 40, box!.y + 20); await page.mouse.up();
  await expect(page.getByLabel("Clip duration")).not.toHaveValue(before);
  await page.getByRole("button", { name: "Insert movable.svg at playhead" }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  await expect(page.getByText("later clips moved right")).toBeVisible();
});
