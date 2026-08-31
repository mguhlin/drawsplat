const { test, expect } = require("@playwright/test");

test("homepage routes natural-language intent to the right tools", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "DrawSplat", exact: true }),
  ).toBeVisible();
  await page.locator("#homeSearch").fill("I need to make slides");
  await expect(page.locator("#homeSearchResults")).toBeVisible();
  await expect(
    page
      .locator("#homeSearchResults")
      .getByRole("link", { name: /ShowSplat/ })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apps" }).click();
  await expect(
    page.getByRole("dialog", { name: "What do you want to do?" }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("searchbox").fill("pictograph");
  await expect(
    page.getByRole("dialog").getByRole("link", { name: /GraphSplat/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("Studio searches aliases, filters functions, and saves favorites locally", async ({
  page,
}) => {
  await page.goto("/studio/");
  await expect(page.locator(".ds-tool-card")).toHaveCount(57);
  await page.locator("#toolSearch").fill("photo editor");
  await expect(page.locator(".ds-tool-card h3").first()).toHaveText(
    "ImageSplat™",
  );
  await page.locator(".ds-tool-card").first().locator(".ds-favorite").click();
  await expect(page.locator("#favoritesShelf")).toBeVisible();
  await page.reload();
  await expect(page.locator("#favoritesShelf")).toContainText(
    "ImageSplat™",
  );
  await page.locator("#toolSearch").fill("");
  await page.locator('#categoryFilters [data-category="games"]').click();
  const resultCount = await page.locator(".ds-tool-card").count();
  expect(resultCount).toBeGreaterThan(10);
  expect(resultCount).toBeLessThan(57);
});

test("Studio consolidates legacy graph tools under GraphSplat", async ({
  page,
}) => {
  await page.goto("/studio/?category=data");
  await expect(
    page.locator('.ds-tool-card[data-id="graphsplat"] h3'),
  ).toHaveText("GraphSplat");
  await expect(
    page.locator('.ds-tool-card[data-id="graph-maker"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.ds-tool-card[data-id="picture-graph"]'),
  ).toHaveCount(0);
  await expect(page.locator("#resultStatus")).not.toContainText("can't access");
});

test("Studio accepts category deep links", async ({ page }) => {
  await page.goto("/studio/?category=data&q=graph");
  await expect(page.locator("#toolSearch")).toHaveValue("graph");
  await expect(page.getByRole("button", { name: /Data/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".ds-tool-card h3").first()).toContainText(
    /Graph|Chart|Grid/,
  );
});

test("Studio presents recent tools as a compact three-column link list", async ({
  page,
}) => {
  await page.goto("/studio/");
  await page.evaluate(() =>
    localStorage.setItem(
      "drawsplat.recents",
      JSON.stringify(["pdfsplat", "qrsplat", "graphsplat", "videosplat"]),
    ),
  );
  await page.reload();
  await expect(page.locator("#recentsShelf .ds-tool-card")).toHaveCount(0);
  await expect(page.locator("#recentsShelf .ds-recent-links a")).toHaveCount(4);
  await expect(page.locator("#recentsShelf")).toContainText("GraphSplat");
  await expect(page.locator("#recentsShelf")).toHaveCSS(
    "grid-column-start",
    "1",
  );
});

test("major apps expose the shared app launcher", async ({ page }) => {
  for (const url of [
    "/app/whiteboard.html",
    "/solutions/pdfsplat/",
    "/splatworks/gridsplat/",
  ]) {
    await page.goto(url);
    const welcome = page.getByRole("button", { name: "Got it" });
    await welcome.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    if (await welcome.isVisible()) await welcome.click();
    await page.getByRole("button", { name: "Open DrawSplat apps" }).click();
    await expect(
      page.getByRole("dialog", { name: "What do you want to do?" }),
    ).toBeVisible();
    await page.getByRole("dialog").getByRole("searchbox").fill("spreadsheet");
    await expect(
      page.getByRole("dialog").getByRole("link", { name: /GridSplat/ }),
    ).toBeVisible();
  }
});
