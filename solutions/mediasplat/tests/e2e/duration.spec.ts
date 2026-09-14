import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("recovers the full length of a WebM recording without duration metadata", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles(resolve("tests/fixtures/streamed.webm"));
  await expect.poll(async () => Number(await page.getByLabel("End time").inputValue())).toBeGreaterThan(1.8);
  await expect.poll(async () => Number(await page.getByLabel("End time").inputValue())).toBeLessThan(2.2);
  await page.getByRole("button", { name: /Split/ }).click();
  await page.locator('input[type="file"]').setInputFiles(resolve("tests/fixtures/streamed.webm"));
  await page.getByRole("button", { name: "Split media" }).click();
  await expect(page.getByRole("region", { name: "Output files" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(2);
});
