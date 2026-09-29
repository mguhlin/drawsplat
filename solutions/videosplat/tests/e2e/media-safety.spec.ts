import { expect, test, type Page } from "@playwright/test";

const image = (name = "scene.svg") => ({
  name, mimeType: "image/svg+xml",
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="red"/></svg>'),
});
const input = (page: Page) => page.locator('input[accept="video/*,audio/*,image/*"]');

async function manifest(page: Page) {
  const download = page.waitForEvent("download");
  await page.keyboard.press("Control+s");
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString());
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("videosplat-splash-seen", "1"));
  await page.goto("./");
});

test("removing media can be undone with the source still available after reopening", async ({ page }) => {
  await input(page).setInputFiles(image());
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove scene.svg", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.getByText("Media missing — relink required", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "scene.svg", exact: true })).toHaveJSProperty("naturalWidth", 160);
  const saved = await manifest(page);
  await page.reload();
  await page.locator('input[accept=".json,.videosplat.json,application/json"]').setInputFiles({
    name: "restored.videosplat.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.getByText("Project opened — relink any missing media", { exact: true })).toBeVisible();
  await expect(page.getByText("Media missing — relink required", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "scene.svg", exact: true })).toHaveJSProperty("naturalWidth", 160);
});

test("media removal cannot delete clips on a locked track", async ({ page }) => {
  await input(page).setInputFiles(image());
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: "Lock Video 1", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove scene.svg", exact: true })).toBeDisabled();
  expect((await manifest(page)).tracks[0].clips).toHaveLength(1);
});

test("importing media creates an unlocked track instead of modifying a locked track", async ({ page }) => {
  await input(page).setInputFiles(image());
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: "Lock Video 1", exact: true }).click();
  await input(page).setInputFiles(image("second.svg"));
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  const saved = await manifest(page);
  expect(saved.tracks[0].clips).toHaveLength(1);
  expect(saved.tracks.find((track: any) => !track.locked && track.clips.some((clip: any) => clip.name === "second.svg"))).toBeTruthy();
});

test("a failed file in a batch does not discard already imported files", async ({ page }) => {
  await input(page).setInputFiles([image(), { name: "broken.png", mimeType: "image/png", buffer: Buffer.from("invalid image") }]);
  await expect(page.getByText("The browser could not decode this image.", { exact: true })).toBeVisible();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  expect((await manifest(page)).assets.map((asset: any) => asset.name)).toEqual(["scene.svg"]);
});

test("an aborted autosave reports failure instead of claiming the project was saved", async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === "projects") request.addEventListener("success", () => this.transaction.abort());
      return request;
    };
  });
  await page.reload();
  await expect(page.getByText("Autosave failed — export a project copy", { exact: true })).toBeVisible();
  await expect(page.getByText("Autosaved locally", { exact: true })).toHaveCount(0);
});
