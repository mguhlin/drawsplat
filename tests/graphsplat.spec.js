const { test, expect } = require("@playwright/test");

test("GraphSplat renders every graph workspace", async ({ page }) => {
  await page.goto("/solutions/graphsplat/");
  await expect(page.locator("#canvas svg")).toBeVisible();

  for (const mode of ["picture", "coordinate", "expression", "specialty"]) {
    await page.locator("#mode").selectOption(mode);
    await expect(page.locator(`#${mode}Controls`)).toBeVisible();
    await expect(page.locator("#canvas svg")).toBeVisible();
  }
});

test("GraphSplat supports scatter data, pictographs, and safe expressions", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/");
  await page.locator("#quickType").selectOption("scatter");
  await page.locator("#quickData").fill("A,1,4\nB,3,7\nC,8,2");
  await expect(page.locator("#canvas svg circle")).toHaveCount(3);

  await page.locator("#mode").selectOption("picture");
  await page.locator("#pictureKey").fill("2");
  await expect(page.locator("#canvas svg")).toContainText("= 2");

  await page.locator("#mode").selectOption("expression");
  await page.locator("#expressions").fill("sin(x)\na*x^2+b");
  await page.locator("#paramA").fill("2");
  await expect(page.locator("#canvas svg path")).not.toHaveCount(0);
  await page.locator("#expressions").fill("window.alert(1)");
  await expect(page.locator("#status")).toContainText(
    /Unsupported|Unexpected|Unknown/,
  );
});

test("bars and picture symbols can be dragged to change their values", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/");
  const bar = page.locator('#canvas [data-drag-row="0"]').first();
  const barBox = await bar.boundingBox();
  await page.mouse.move(barBox.x + barBox.width / 2, barBox.y + 5);
  await page.mouse.down();
  await page.mouse.move(barBox.x + barBox.width / 2, barBox.y - 100, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.locator("#quickData")).not.toHaveValue(
    /Reading,12(?:\n|$)/,
  );

  await page.locator("#mode").selectOption("picture");
  const picture = page.locator('#canvas [data-drag-row="0"]').first();
  const pictureBox = await picture.boundingBox();
  await page.mouse.move(
    pictureBox.x + pictureBox.width / 2,
    pictureBox.y + pictureBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    pictureBox.x + pictureBox.width / 2,
    pictureBox.y - 90,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(page.locator(".picture-row .value").first()).not.toHaveValue(
    "6",
  );
});

test("GraphSplat saves locally, resets cleanly, and exports", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/?mode=picture");
  await page.locator("#projectName").fill("Class graph");
  await page.locator("#saveProject").click();
  await expect(page.locator("#savedProjects")).toContainText("Class graph");

  await page.locator(".picture-row .label").first().fill("Changed");
  await page.locator("#reset").click();
  await expect(page.locator(".picture-row .label").first()).toHaveValue(
    "Apples",
  );
  await expect(page.locator("#mode")).toHaveValue("picture");

  const download = page.waitForEvent("download");
  await page.locator("#downloadSvg").click();
  await expect((await download).suggestedFilename()).toBe("class-graph.svg");
});

test("legacy graph URLs preserve bookmarks through mode redirects", async ({
  page,
}) => {
  await page.goto("/solutions/graph-maker/");
  await expect(page).toHaveURL(/graphsplat\/\?mode=coordinate/);
  await page.goto("/solutions/picture-graph/");
  await expect(page).toHaveURL(/graphsplat\/\?mode=picture/);
});

test("GraphSplat is discoverable by graph aliases", async ({ page }) => {
  for (const query of ["picture graph", "graphing calculator", "pictograph"]) {
    await page.goto(`/studio/?q=${encodeURIComponent(query)}`);
    await expect(page.locator(".ds-tool-card h3").first()).toHaveText(
      "GraphSplat",
    );
  }
});
