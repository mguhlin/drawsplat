const { expect, test } = require("@playwright/test");

test("the former ImageSplat URL redirects to the canonical route", async ({
  page,
}) => {
  await page.goto("/solutions/splatimage-studio/");
  await expect(page).toHaveURL(/\/solutions\/imagesplat\/$/);
  await expect(page.getByRole("heading", { name: "ImageSplat™" })).toBeVisible();
});

test("ImageSplat copies the complete annotated canvas", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async ([item]) => {
          const blob = await item.getType("image/png");
          const bitmap = await createImageBitmap(blob);
          window.__copiedPngSize = {
            width: bitmap.width,
            height: bitmap.height,
          };
        },
      },
    });
  });
  await page.goto("/solutions/imagesplat/");

  await expect(page.getByRole("heading", { name: "ImageSplat™" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DrawSplat™ Tools" })).toBeVisible();

  const input = page.locator("#imageInput");
  await input.setInputFiles({
    name: "background.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  const canvas = page.locator("#stage");

  await page.getByRole("button", { name: "Copy PNG", exact: true }).first().click();
  await expect
    .poll(() => page.evaluate(() => window.__copiedPngSize))
    .not.toBeUndefined();
  const copiedSize = await page.evaluate(() => window.__copiedPngSize);
  const canvasSize = await canvas.evaluate((element) => ({
    width: element.width,
    height: element.height,
  }));

  expect(copiedSize).toEqual(canvasSize);
});
