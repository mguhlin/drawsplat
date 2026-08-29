const { test, expect } = require("@playwright/test");

test("GraphSplat renders every graph workspace", async ({ page }) => {
  await page.goto("/solutions/graphsplat/");
  await expect(page.locator("#canvas svg")).toBeVisible();
  await expect(page.locator(".mode-controls:visible")).toHaveCount(1);
  await expect(page.locator("#viewportControls")).toBeHidden();

  for (const mode of [
    "picture",
    "coordinate",
    "expression",
    "geometry",
    "specialty",
  ]) {
    await page.locator("#mode").selectOption(mode);
    await expect(page.locator(`#${mode}Controls`)).toBeVisible();
    await expect(page.locator(".mode-controls:visible")).toHaveCount(1);
    await expect(page.locator("#canvas svg")).toBeVisible();
  }
});

test("quick marks support right-click value and color editing", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/");
  const bar = page.locator('#canvas [data-quick-row="0"]').first();
  await bar.click({ button: "right" });
  await expect(page.locator("#quickEditDialog")).toBeVisible();
  await page.locator("#quickEditValue").fill("25");
  await page.locator("#quickEditColor").fill("#ef4444");
  await page.locator("#quickEditApply").click();
  await expect(page.locator("#quickData")).toHaveValue(/Reading,25/);
  await expect(
    page.locator('#canvas [data-quick-row="0"]').first(),
  ).toHaveAttribute("fill", "#ef4444");
});

test("expression curves drag vertically and geometry points remain editable", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/?mode=expression");
  const curve = page.locator('#canvas [data-expression-index="0"]');
  const curvePoint = await curve.evaluate((path) => {
    const point = path.getPointAtLength(path.getTotalLength() * 0.35),
      screen = new DOMPoint(point.x, point.y).matrixTransform(
        path.getScreenCTM(),
      );
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.move(curvePoint.x, curvePoint.y);
  await page.mouse.down();
  await page.mouse.move(curvePoint.x, curvePoint.y - 60, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("#expressions")).toHaveValue(/^\(sin\(x\)\)\+/);

  await page.locator("#mode").selectOption("geometry");
  await expect(page.locator("#canvas [data-geometry-point]")).toHaveCount(3);
  await expect(page.locator("#canvas polygon")).not.toHaveCount(0);
  const point = page.locator('#canvas [data-geometry-point="0"]');
  const pointBox = await point.boundingBox();
  const before = await page.locator("#geometryData").inputValue();
  await page.mouse.move(
    pointBox.x + pointBox.width / 2,
    pointBox.y + pointBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(pointBox.x + 50, pointBox.y - 35, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("#geometryData")).not.toHaveValue(before);
});

test("example library is organized by GraphSplat creation mode", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/");
  await page.locator("#openExamples").click();
  await expect(page.locator("#exampleDialog .example-group")).toHaveCount(6);
  await expect(
    page.locator("#exampleDialog .example-thumbnail svg"),
  ).toHaveCount(12);
  await expect(page.locator("#exampleDialog .lesson-link")).toHaveAttribute(
    "href",
    "lesson-plans.html",
  );
  await page.getByRole("button", { name: /Wave lab/ }).click();
  await expect(page.locator("#mode")).toHaveValue("expression");
  await expect(page.locator("#expressions")).toHaveValue("sin(x)\ncos(x)");
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
    pictureBox.x + pictureBox.width + 90,
    pictureBox.y + pictureBox.height / 2,
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

test("GraphSplat publishes TEKS-aligned lesson plans for three grade bands", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/lesson-plans.html");
  await expect(page.locator("article.lesson")).toHaveCount(3);
  await expect(page.locator("#grades-3-5")).toContainText("3.8(A)–(B)");
  await expect(page.locator("#grades-6-8")).toContainText("8.11(A)–(C)");
  await expect(page.locator("#grades-9-12")).toContainText("A.4(A)–(C)");
  await expect(
    page.getByRole("link", { name: /Open GraphSplat/ }),
  ).toHaveAttribute("href", "./");
});
