const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
async function ready(page) {
  await expect(page.locator("#copyMathml")).toBeEnabled();
  await expect(page.locator("#canvas svg").first()).toBeVisible();
}

test("Equation Studio loads only a local engine, renders all eight examples and exposes MathML", async ({
  page,
  baseURL,
}) => {
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      new URL(r.url()).protocol.startsWith("http") &&
      new URL(r.url()).origin !== new URL(baseURL).origin
    )
      external.push(r.url());
  });
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  await expect(page.locator("#equationMathml math")).toHaveCount(1);
  await expect(page.locator("#equationMathml mfrac")).toHaveCount(3);
  for (const name of [
    "Fraction addition",
    "Quadratic formula",
    "Pythagorean theorem",
    "Slope between two points",
    "Mean of a data set",
    "Definite integral",
    "Aligned equation steps",
    "Matrix and vector",
  ]) {
    await page.locator("#openExamples").click();
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await ready(page);
    await expect(page.locator("#title")).toHaveValue(name);
    await expect(page.locator("#canvas svg path")).not.toHaveCount(0);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("math templates replace selected text and equation sources survive JSON round trips", async ({
  page,
  context,
}) => {
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  await page.locator("#equationTex").fill("a+b");
  await page.locator("#equationTex").evaluate((input) => {
    input.focus();
    input.setSelectionRange(0, 3);
  });
  await page.getByRole("button", { name: "Fraction", exact: true }).click();
  await expect(page.locator("#equationTex")).toHaveValue(
    String.raw`\frac{a+b}{2}`,
  );
  await ready(page);
  const pending = page.waitForEvent("download");
  await page.locator("#downloadProject").click();
  const download = await pending;
  const buffer = await fs.readFile(await download.path());
  const other = await context.newPage();
  await other.goto("/solutions/graphsplat/");
  await other
    .locator("#projectFile")
    .setInputFiles({ name: "math.json", mimeType: "application/json", buffer });
  await ready(other);
  await expect(other.locator("#mode")).toHaveValue("equation");
  await expect(other.locator("#equationTex")).toHaveValue(
    String.raw`\frac{a+b}{2}`,
  );
});

test("equation SVG, PNG and LaTeX exports contain the authored math", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  for (const [button, extension] of [
    ["downloadSvg", "svg"],
    ["downloadPng", "png"],
    ["downloadLatex", "tex"],
  ]) {
    const pending = page.waitForEvent("download");
    await page.locator("#" + button).click();
    const download = await pending;
    const bytes = await fs.readFile(await download.path());
    expect(download.suggestedFilename()).toMatch(
      new RegExp("\\." + extension + "$"),
    );
    if (extension === "svg") {
      const svg = bytes.toString();
      expect(svg).toContain("<path");
      expect(svg).toContain("One half plus one quarter");
      expect(svg).not.toMatch(/<foreignObject|<script|href="https?:/);
    }
    if (extension === "png") {
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(1800);
      expect(bytes.readUInt32BE(20)).toBe(880);
    }
    if (extension === "tex")
      expect(bytes.toString()).toBe(
        String.raw`\frac{1}{2}+\frac{1}{4}=\frac{3}{4}`,
      );
  }
  // Decode the PNG and check for a real rendered equation, not just a blank download.
  const result = await page.locator("#raster").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(200, 180, 1400, 580).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) ink++;
    return ink;
  });
  expect(result).toBeGreaterThan(500);
});

test("invalid and unsafe notation cannot export stale math, and valid input recovers", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  for (const source of [
    String.raw`\frac{1}{`,
    String.raw`\href{javascript:alert(1)}{click}`,
    String.raw`\require{html}`,
    String.raw`\def\x{\x}\x`,
  ]) {
    await page.locator("#equationTex").fill(source);
    await expect(page.locator("#downloadSvg")).toBeDisabled();
    await expect(page.locator("#copyMathml")).toBeDisabled();
    await expect(page.locator("#canvas svg")).toHaveCount(0);
    await expect(page.locator("#status")).not.toHaveText("Rendering equation…");
  }
  await page.locator("#equationTex").fill("x^2+y^2=r^2");
  await ready(page);
  await expect(page.locator("#downloadSvg")).toBeEnabled();
});

test("a delayed engine load cannot overwrite a different workspace", async ({
  page,
}) => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/vendor/equation-engine.mjs", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/solutions/graphsplat/?mode=equation", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#mode").selectOption("quick");
  release();
  await expect(page.locator("#canvas [data-quick-row]")).not.toHaveCount(0);
  await expect(page.locator("#equationSemantics")).toBeHidden();
});

test("read description uses reviewed text and can be stopped", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    window.readTexts = [];
    window.stops = 0;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ localService: true, lang: "en" }],
        speak: (utterance) => window.readTexts.push(utterance.text),
        cancel: () => window.stops++,
      },
    });
  });
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  await page.locator("#equationReading").fill("A reviewed explanation.");
  await ready(page);
  await page.locator("#readEquation").click();
  expect(await page.evaluate(() => readTexts)).toEqual([
    "A reviewed explanation.",
  ]);
  const stops = await page.evaluate(() => window.stops);
  await page.locator("#stopEquationReading").click();
  expect(await page.evaluate(() => window.stops)).toBeGreaterThan(stops);
});

test("equation controls fit a phone and retain notation when changing language", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  const tex = await page.locator("#equationTex").inputValue();
  await page.locator(".ds-language-control select").selectOption("es");
  expect(await page.locator("#equationTex").inputValue()).toBe(tex);
  try {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
  } catch (error) {
    console.log(
      "PHONE_OVERFLOW",
      JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          items: [...document.querySelectorAll("body *")]
            .map((el) => ({
              tag: el.tagName,
              id: el.id,
              cls: typeof el.className === "string" ? el.className : "svg",
              text: el.textContent.slice(0, 60),
              left: el.getBoundingClientRect().left,
              right: el.getBoundingClientRect().right,
              width: el.getBoundingClientRect().width,
            }))
            .filter((e) => e.right > innerWidth + 0.5 || e.left < -0.5)
            .slice(0, 30),
        })),
      ),
    );
    await page.screenshot({
      path: testInfo.outputPath("overflow.png"),
      fullPage: true,
    });
    throw error;
  }
  await page.screenshot({
    path: testInfo.outputPath("equations-phone.png"),
    fullPage: true,
  });
});

test("opening an existing function project restores its workspace", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/");
  await page.locator("#projectFile").setInputFiles({
    name: "function.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        type: "drawsplat-graph",
        version: 1,
        mode: "expression",
        controls: { expressions: "x^2-4" },
      }),
    ),
  });
  await expect(page.locator("#mode")).toHaveValue("expression");
  await expect(page.locator("#expressions")).toHaveValue("x^2-4");
  await expect(
    page.locator('#canvas [data-expression-index="0"]'),
  ).toBeVisible();
});

test("the expression value table treats rejected markup as text", async ({
  page,
}) => {
  await page.goto("/solutions/graphsplat/?mode=expression");
  await page
    .locator("#expressions")
    .fill('<img src=x onerror="window.graphInjected=true">');
  await page.locator("#expressionTable").click();
  await expect(page.locator("#valueTable img")).toHaveCount(0);
  expect(await page.evaluate(() => window.graphInjected)).toBeUndefined();
});

test("project imports preserve an authored description and ignore a malformed saved-project index", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("graphsplat.projects.v1", "{}"),
  );
  await page.goto("/solutions/graphsplat/");
  await expect(page.locator("#canvas svg")).toBeVisible();
  await page.locator("#projectFile").setInputFiles({
    name: "project.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        type: "drawsplat-graph",
        version: 1,
        mode: "equation",
        controls: {
          equationTex: "a+b=c",
          altDescription: "My reviewed math description.",
        },
      }),
    ),
  });
  await ready(page);
  await expect(page.locator("#altDescription")).toHaveValue(
    "My reviewed math description.",
  );
  await expect(page.locator("#canvas svg").first()).toContainText(
    "My reviewed math description.",
  );
});

test("no local speech voice leaves the description readable without using a remote voice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ localService: false, lang: "en" }],
        speak: () => {
          throw Error("Remote voice must not be used");
        },
        cancel: () => {},
      },
    });
  });
  await page.goto("/solutions/graphsplat/?mode=equation");
  await ready(page);
  await page.locator("#readEquation").click();
  await expect(page.locator("#status")).toContainText("No local voice");
  await expect(page.locator("#equationReading")).not.toHaveValue("");
});
