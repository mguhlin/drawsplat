import { expect, test } from "@playwright/test";

test("recording timer excludes paused time", async ({ page }) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.getByRole("button", { name: "Record", exact: true }).first().click();
  await page.getByRole("button", { name: "Continue to microphone" }).click();
  await expect(page.locator("#status")).toHaveText("Recording");
  await page.waitForTimeout(1100);
  await page.locator('[data-action="pause-record"]').click();
  await expect(page.locator("#status")).toHaveText("Recording paused");
  const paused = await page.locator("#time").textContent();
  await page.waitForTimeout(1200);
  await expect(page.locator("#time")).toHaveText(paused!);
  await page.locator('[data-action="pause-record"]').click();
  await expect(page.locator("#status")).toHaveText("Recording");
  const seconds = await page.locator("#time").evaluate(el => {
    const parts = el.textContent!.split(":").map(Number);
    return parts.reduce((total, part) => total * 60 + part, 0);
  });
  expect(seconds).toBeLessThan(2);
  await page.locator('[data-action="stop"]').click();
  await expect(page.locator("[data-clip]")).toHaveCount(1);
});
