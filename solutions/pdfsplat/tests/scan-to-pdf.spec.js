const { test, expect } = require("@playwright/test");
const { PDFDocument } = require("../vendor/pdf-lib.min.js");

async function photo(page, color = "white") {
  const data = await page.evaluate((color) => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = "black";
    ctx.font = "20px sans-serif";
    ctx.fillText("Local scan test", 70, 100);
    return c.toDataURL("image/png").split(",")[1];
  }, color);
  return {
    name: "paper.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}
async function scan(page) {
  await page.goto("/solutions/pdfsplat/");
  await page.getByRole("button", { name: "Scan to PDF", exact: true }).click();
}

test("corrects a trapezoid into a rectangular page and rejects crossed corners", async ({
  page,
}) => {
  await page.goto("/solutions/pdfsplat/");
  const result = await page.evaluate(async () => {
    const { rectify } = await import("/solutions/pdfsplat/src/scan-image.js");
    const canvas = document.createElement("canvas");
    canvas.width = 201;
    canvas.height = 201;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 201, 201);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(160, 40);
    ctx.lineTo(180, 180);
    ctx.lineTo(20, 160);
    ctx.closePath();
    ctx.fill();
    const points = [
      { x: 0.2, y: 0.1 },
      { x: 0.8, y: 0.2 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.8 },
    ];
    const output = rectify(canvas, points);
    const oc = output.getContext("2d");
    const samples = [
      [5, 5],
      [output.width - 6, 5],
      [5, output.height - 6],
      [output.width - 6, output.height - 6],
    ].map(([x, y]) => oc.getImageData(x, y, 1, 1).data[0]);
    let rejected = false;
    try {
      rectify(canvas, [points[0], points[2], points[1], points[3]]);
    } catch {
      rejected = true;
    }
    const rotated = rectify(canvas, points, "gray", 90);
    return {
      samples,
      rejected,
      width: output.width,
      height: output.height,
      rotated: [rotated.width, rotated.height],
    };
  });
  expect(result.samples.every((v) => v > 245)).toBe(true);
  expect(result.rejected).toBe(true);
  expect(result.rotated).toEqual([result.height, result.width]);
});

test("creates, reorders and downloads two scans, then opens them in the editor", async ({
  page,
}) => {
  await scan(page);
  const requests = [];
  page.on("request", (r) => {
    if (
      new URL(r.url()).origin !== new URL(page.url()).origin &&
      !r.url().startsWith("blob:")
    )
      requests.push(r.url());
  });
  await page
    .locator("#scanFiles")
    .setInputFiles([await photo(page), await photo(page, "#ffeedd")]);
  await expect(page.locator("#scanPages li")).toHaveCount(2);
  await expect(page.locator("#scanDownload")).toBeDisabled();
  await page
    .getByRole("button", { name: "Top left corner", exact: true })
    .press("ArrowRight");
  await page.locator("#scanFilter").selectOption("gray");
  await page.locator("#scanSave").click();
  await expect(page.locator("#scanResult")).toBeVisible();
  await page
    .getByRole("button", { name: "Page 2 · needs review", exact: true })
    .click();
  await page.locator("#scanRotate").click();
  await page.locator("#scanSave").click();
  await expect(page.locator("#scanDownload")).toBeEnabled();
  await page
    .getByRole("button", { name: "Move up page 2", exact: true })
    .click();
  await page.locator("#scanPaper").selectOption("letter");
  const download = page.waitForEvent("download");
  await page.locator("#scanDownload").click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const pdf = await PDFDocument.load(Buffer.concat(chunks));
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPages().map((p) => p.getSize())).toEqual([
    { width: 612, height: 792 },
    { width: 792, height: 612 },
  ]);
  await page.locator("#scanAdd").click();
  await expect(page.locator("#scanDialog")).not.toBeVisible();
  await expect(page.locator("#pageCount")).toHaveText("2");
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Scan to PDF", exact: true }).click();
  await expect(page.locator("#scanPages li")).toHaveCount(0);
  await page.locator("#scanFiles").setInputFiles(await photo(page));
  await page.locator("#scanSave").click();
  await page.locator("#scanAdd").click();
  await expect(page.locator("#pageCount")).toHaveText("3");
  await page.locator("#undoButton").click();
  await expect(page.locator("#pageCount")).toHaveText("2");
});

test("reports invalid images and handles camera cancellation without keeping the camera on", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        new Promise((resolve) => {
          window.finishCamera = () => {
            const c = document.createElement("canvas");
            const s = c.captureStream();
            window.testCamera = s;
            resolve(s);
          };
        }),
    });
  });
  await scan(page);
  await page
    .locator("#scanFiles")
    .setInputFiles({
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid image"),
    });
  await expect(page.locator("#scanStatus")).toContainText("cannot be opened");
  await page.locator("#scanCamera").click();
  await page.locator("#scanClose").click();
  await page.evaluate(() => window.finishCamera());
  await expect
    .poll(() =>
      page.evaluate(() => window.testCamera.getTracks()[0].readyState),
    )
    .toBe("ended");
});

test("captures a camera page and stops tracks on close", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 240;
        document.body.append(c);
        const ctx = c.getContext("2d");
        setInterval(() => {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, 320, 240);
          ctx.fillStyle = "black";
          ctx.fillText("camera", 50, 50);
        }, 50);
        window.testCamera = c.captureStream(15);
        return window.testCamera;
      },
    });
  });
  await scan(page);
  await page.locator("#scanCamera").click();
  await expect(page.locator("#scanVideo")).toHaveJSProperty("readyState", 4);
  await page.locator("#scanSnapshot").click();
  await expect(page.locator("#scanPages li")).toHaveCount(1);
  await page.locator("#scanSave").click();
  await expect(page.locator("#scanDownload")).toBeEnabled();
  await page.locator("#scanClose").click();
  expect(
    await page.evaluate(() => window.testCamera.getTracks()[0].readyState),
  ).toBe("ended");
});

test("fits a phone screen and permits keyboard corner adjustment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await scan(page);
  await page.locator("#scanFiles").setInputFiles(await photo(page));
  const corner = page.getByRole("button", {
    name: "Top left corner",
    exact: true,
  });
  await corner.press("Shift+ArrowRight");
  await corner.press("Shift+ArrowDown");
  const position = await corner.evaluate((e) => [e.style.left, e.style.top]);
  expect(position).toEqual(["2%", "2%"]);
  expect(
    await page
      .locator("#scanDialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await page.locator("#scanSave").click();
  await expect(page.locator("#scanDownload")).toBeEnabled();
});
