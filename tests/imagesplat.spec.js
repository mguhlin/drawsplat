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
  await expect(page.getByRole("button", { name: "Open DrawSplat apps" })).toBeVisible();

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

test('new text has no Label suffix, and existing text can be edited, canceled, and undone', async ({ page, context }, testInfo) => {
  await page.goto('/solutions/imagesplat/');
  await page.locator('.tool-grid [data-tool="text"]').click();
  await page.locator('#stage').click({ position: { x: 100, y: 100 } });
  await expect(page.locator('#textValue')).toHaveValue('');
  await page.locator('#textInsert').click();
  await expect(page.locator('#textDialog')).toBeVisible();
  await expect(page.locator('#layerList .layer')).toHaveCount(0);
  const pasted = 'Practical strategies. Powerful learning.\nA second paragraph, exactly as pasted.';
  if (testInfo.project.name === 'chrome') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(text => navigator.clipboard.writeText(text), pasted);
    await page.locator('#textValue').focus();
    await page.keyboard.press('Control+V');
  } else {
    await page.locator('#textValue').fill(pasted);
  }
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await page.locator('#textFontFamily').selectOption("Georgia, 'Times New Roman', serif");
  await page.locator('#textSizeNumber').fill('40');
  await page.locator('#textBold').click();
  await page.locator('#textInsert').click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.locator('#layerList .layer .name').dblclick();
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await expect(page.locator('#textFontFamily')).toHaveValue("Georgia, 'Times New Roman', serif");
  await expect(page.locator('#textSizeNumber')).toHaveValue('40');
  await expect(page.locator('#textBold')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#textInsert')).toHaveText('Save changes');
  await page.locator('#textValue').fill('Changed wording\nAnother line');
  await page.locator('#textItalic').click();
  await page.locator('#textInsert').click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#textValue')).toHaveValue('Changed wording\nAnother line');
  await expect(page.locator('#textItalic')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#textValue').fill('Canceled change');
  await page.locator('#textCancel').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#textValue')).toHaveValue('Changed wording\nAnother line');
  await page.locator('#textCancel').click();
  await page.locator('[data-action="undo"]').last().click();
  await expect(page.locator('#layerList .layer')).toHaveCount(1);
  await page.locator('#layerList .layer .name').dblclick();
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await expect(page.locator('#textItalic')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#textCancel').click();
  await page.locator('#stage').dblclick({ position: { x: 110, y: 110 } });
  await expect(page.locator('#textValue')).toHaveValue(pasted);
  await page.locator('#textCancel').click();
  await page.locator('[data-action="editText"]').evaluate(button => button.click());
  await expect(page.locator('#textValue')).toHaveValue(pasted);
});
