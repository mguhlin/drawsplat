import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });
test("cancel during engine download allows a successful retry", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route("**/ffmpeg-core.part-*", async route => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles(resolve("tests/fixtures/streamed.webm"));
  await page.getByLabel("End time").fill("1");
  await page.getByRole("button", { name: "Trim media" }).click();
  await expect.poll(() => requested).toBe(true);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  release();
  await expect(page.getByRole("button", { name: "Trim media" })).toBeEnabled({ timeout: 15000 });
  await page.getByRole("button", { name: "Trim media" }).click();
  await expect(page.getByRole("region", { name: "Output files" })).toBeVisible({ timeout: 15000 });
});
