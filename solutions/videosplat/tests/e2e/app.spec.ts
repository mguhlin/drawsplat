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
