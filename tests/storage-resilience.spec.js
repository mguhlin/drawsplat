const { test, expect } = require("@playwright/test");

async function blockStorage(page, mode = "blocked") {
  await page.addInitScript((mode) => {
    if (window !== window.top) return;
    if (mode === "blocked")
      for (const key of ["localStorage", "sessionStorage"])
        Object.defineProperty(window, key, {
          get() {
            throw new DOMException("Storage blocked", "SecurityError");
          },
        });
    else
      Storage.prototype.setItem = function () {
        throw new DOMException("Storage full", "QuotaExceededError");
      };
  }, mode);
}

for (const [name, url, selector] of [
  ["WriteSplat", "/splatworks/writesplat/", '[contenteditable="true"]'],
  ["ShowSplat", "/splatworks/showsplat/", "#slideCanvas"],
  ["ListSplat", "/splatworks/listsplat/", '[data-action="add-record"]:visible'],
  ["GridSplat", "/splatworks/gridsplat/", '[data-testid="cell-A1"]'],
  ["Bingo Caller", "/solutions/bingo-caller/", "#bcard .cell"],
  ["Dicebreakers", "/solutions/dicebreakers/", "#prompts textarea"],
  ["SplatBot", "/solutions/splatbot-studio/", "#missionSelect option"],
  ["VideoSplat", "/solutions/videosplat/", ".splash-choice"],
  ["Administration", "/admin/admin.html", "#adminViewerPreviewBtn"],
])
  test(`${name} starts when browser storage is blocked`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await blockStorage(page);
    await page.goto(url);
    await expect(page.locator(selector).first()).toBeAttached();
    if (name === "Administration") {
      await page.locator("#adminViewerPreviewBtn").click();
      await expect(page.locator("body")).toHaveClass(/admin-viewer/);
    }
    if (name === "VideoSplat") {
      await page.getByRole("button", { name: /Edit video/ }).click();
      await expect(page.locator(".launch-splash")).toBeHidden();
    }
    if (name === "Bingo Caller") {
      await page.locator("#next").click();
      await expect(page.locator("#called .chip")).toHaveCount(1);
      await expect(page.locator("#storageStatus")).toBeVisible();
    }
    if (name === "SplatBot") {
      await page.locator("#skipStoryBtn").click();
      await page.locator("#roleSelect").selectOption("teacher");
      await page.locator("#wordsTab").click();
      await page.locator("#wordProgram").fill("move 1");
      const pending = page.waitForEvent("download");
      await page.locator("#exportBtn").click();
      const file = await pending;
      const data = JSON.parse(
        await require("node:fs/promises").readFile(await file.path(), "utf8"),
      );
      expect(data.words).toBe("move 1");
    }
    expect(errors).toEqual([]);
  });

for (const mode of ["blocked", "quota"])
  test(`WriteSplat reports failed ${mode} autosave and can download the working document`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await blockStorage(page, mode);
    await page.goto("/splatworks/writesplat/");
    const editor = page.locator(".ProseMirror[contenteditable=true]");
    await editor.fill("Keep this writing.");
    await expect(page.locator("#saveState")).toContainText("Not saved");
    const pending = page.waitForEvent("download");
    await page
      .locator('[data-action="save-json"]')
      .filter({ visible: true })
      .first()
      .click();
    const download = await pending;
    const saved = JSON.parse(
      await require("node:fs/promises").readFile(await download.path(), "utf8"),
    );
    expect(JSON.stringify(saved.document.content)).toContain(
      "Keep this writing.",
    );
    expect(errors).toEqual([]);
  });

test("ListSplat keeps changes and undo usable after an autosave quota failure", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockStorage(page, "quota");
  await page.goto("/splatworks/listsplat/");
  const before = await page.locator(".cell-input").count();
  await page.locator('[data-action="add-record"]:visible').click();
  await expect(page.locator("[data-save-status]")).toContainText("Not saved");
  expect(await page.locator(".cell-input").count()).toBeGreaterThan(before);
  await page.keyboard.press("Control+z");
  expect(await page.locator(".cell-input").count()).toBe(before);
  expect(errors).toEqual([]);
});

test("a corrupt ListSplat draft allows a fresh project to open", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("listsplat.autosave.v1", '{"schema":null}'),
  );
  await page.goto("/splatworks/listsplat/");
  await expect(
    page.locator('[data-action="add-record"]:visible'),
  ).toBeVisible();
});

test("transferred workspace never falls back to the main draft when session storage is blocked", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    localStorage.setItem("drawsplat.test.original", "original");
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    history.replaceState(
      null,
      "",
      "/splatworks/showsplat/?open-file=00000000-0000-4000-8000-000000000000",
    );
    const bridge =
      await import("/splatworks/shared/file-bridge.js?isolation-test");
    let blocked = false;
    try {
      bridge.workspaceStorage().setItem("drawsplat.test.original", "replaced");
    } catch {
      blocked = true;
    }
    return {
      transferred: bridge.isTransferredWorkspace(),
      blocked,
      original: localStorage.getItem("drawsplat.test.original"),
    };
  });
  expect(result).toEqual({
    transferred: true,
    blocked: true,
    original: "original",
  });
});

test("Bingo cards contain five distinct values per column and cleared marks survive reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let seed = 7;
    Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  });
  await page.goto("/solutions/bingo-caller/");
  for (let round = 0; round < 8; round++) {
    await page.locator("#join").click();
    const values = await page.locator("#bcard .cell").allTextContents();
    for (let col = 0; col < 5; col++) {
      const column = values.filter((_, i) => i % 5 === col);
      expect(new Set(column).size).toBe(5);
    }
  }
  await page.locator("#bcard .cell").first().click();
  await expect(page.locator("#bcard .cell.marked")).toHaveCount(2);
  await page.locator("#newGame").click();
  await expect(page.locator("#bcard .cell.marked")).toHaveCount(1);
  await page.locator("#bcard .cell").first().click();
  await page.locator("#resetMarks").click();
  await page.reload();
  await expect(page.locator("#bcard .cell.marked")).toHaveCount(1);
});

test("Bingo room changes isolate calls and release old broadcast subscriptions", async ({
  page,
  context,
}) => {
  await page.goto("/solutions/bingo-caller/");
  const other = await context.newPage();
  await other.goto("/solutions/bingo-caller/");
  const third = await context.newPage();
  await third.goto("/solutions/bingo-caller/");
  for (const tab of [page, other, third])
    await tab.evaluate(() => {
      speechSynthesis.speak = () => {};
    });
  await page.locator("#newGame").click();
  await page.locator("#next").click();
  await expect(other.locator("#called .chip")).toHaveCount(1);
  await other.locator("#room").fill("another-room");
  await other.locator("#room").dispatchEvent("change");
  await expect(other.locator("#called .chip")).toHaveCount(0);
  await page.locator("#next").click();
  await expect(third.locator("#called .chip")).toHaveCount(2);
  await expect(other.locator("#called .chip")).toHaveCount(0);
  await third.locator("#room").fill("another-room");
  await third.locator("#room").dispatchEvent("change");
  await other.locator("#next").click();
  await expect(third.locator("#called .chip")).toHaveCount(1);
  await expect(page.locator("#called .chip")).toHaveCount(2);
});

test("Bingo ignores malformed saved games and cards", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bingo-live-classroom", '{"pool":null}');
    localStorage.setItem("bingo-live-classroom-card-", "null");
  });
  await page.goto("/solutions/bingo-caller/");
  await page.locator("#room").fill("classroom");
  await page.locator("#room").dispatchEvent("change");
  await expect(page.locator("#bcard .cell")).toHaveCount(25);
  await page.locator("#next").click();
  await expect(page.locator("#called .chip")).toHaveCount(1);
});
