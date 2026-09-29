import { expect, test, type Page } from "@playwright/test";

async function savedClips(page: Page) {
  const download = page.waitForEvent("download");
  await page.keyboard.press("Control+s");
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString()).tracks[0].clips;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("videosplat-splash-seen", "1"));
  await page.goto("./");
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({
    name: "scene.svg", mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="red"/></svg>'),
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
});

for (const mode of ["insert", "overwrite"]) test(`${mode} in the middle preserves unaffected footage and undo restores it`, async ({ page }) => {
  await page.getByLabel("Clip duration", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByLabel("Clip duration", { exact: true }).fill("5");
  await page.getByLabel("Timeline edit mode").selectOption(mode);
  await page.locator(".ruler").click({ position: { x: 83, y: 10 } });
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  const clips = (await savedClips(page)).sort((a: any, b: any) => a.start - b.start);
  expect(clips.map((clip: any) => [clip.start, clip.duration, clip.sourceStart])).toEqual(
    mode === "insert" ? [[0, 2, 0], [2, 1, 0], [3, 3, 2]] : [[0, 2, 0], [2, 1, 0], [3, 2, 3]],
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  expect((await savedClips(page))[0]).toMatchObject({ start: 0, duration: 5, sourceStart: 0 });
});

test("media-bin insertion splits a clip at the playhead", async ({ page }) => {
  await page.locator(".ruler").click({ position: { x: 83, y: 10 } });
  await page.getByRole("button", { name: "Insert scene.svg at playhead" }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  expect((await savedClips(page)).map((clip: any) => [clip.start, clip.duration, clip.sourceStart]))
    .toEqual([[0, 2, 0], [7, 3, 2], [2, 5, 0]]);
});

test("locking a selected track protects it from inspector and keyboard edits", async ({ page }) => {
  await page.getByRole("button", { name: "Lock Video 1", exact: true }).click();
  await expect(page.getByLabel("Clip duration", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await page.keyboard.press("Delete");
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  expect((await savedClips(page))[0]).toMatchObject({ start: 0, duration: 5 });
  await page.getByRole("button", { name: "Lock Video 1", exact: true }).click();
  await page.locator(".timeline-clip").click();
  await expect(page.getByLabel("Clip duration", { exact: true })).toBeVisible();
});


test("rejects an incomplete project without losing the current edit", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.locator('input[accept=".json,.videosplat.json,application/json"]').setInputFiles({
    name: "broken.videosplat.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schema: "videosplat-project", version: 2, id: "broken", name: "Broken", tracks: [], assets: [] })),
  });
  await expect(page.getByText("Project file is incomplete", { exact: false })).toBeVisible();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue("Untitled project");
  expect(errors).toEqual([]);
});
