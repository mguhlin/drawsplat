const { chromium } = require("../../../node_modules/@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const p = await b.newPage({ locale: "en-US" });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const origin = process.env.CLIPSPLAT_ORIGIN || "http://127.0.0.1:4186";
  await p.goto(origin + "/solutions/clipsplat/");
  await p.waitForSelector("#language");
  assert.match(await p.locator(".brand").textContent(), /ClipSplat™/);
  assert.equal(await p.locator("#camera").evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(109, 56, 232)");
  assert.equal(await p.locator("#language option").count(), 6);
  assert.equal(await p.locator("#color").inputValue(), "#4720a4");
  await p.locator("#creator").fill("Miguel");
  await p.locator("#intro-text").fill("My opening title");
  await p.locator("#outro-text").fill("My closing title");
  for (const [code, label] of [["es", "Crear MP4"], ["vi", "T\u1EA1o MP4"], ["ar", "\u0625\u0646\u0634\u0627\u0621 MP4"], ["zh", "\u751F\u6210MP4"], ["uh", "MP4 \u092C\u0928\u093E\u090F\u0901 / MP4 \u0628\u0646\u0627\u0626\u06CC\u06BA"], ["en", "Create MP4"]]) {
    await p.locator("#language").selectOption(code);
    assert.equal(await p.locator("#export").innerText(), label);
    assert.equal(await p.locator("#intro-text").inputValue(), "My opening title");
    assert.equal(await p.locator("#outro-text").inputValue(), "My closing title");
    assert.equal(await p.locator("#creator").inputValue(), "Miguel");
    if (code === "ar") assert.equal(await p.locator("html").getAttribute("dir"), "rtl");
    await p.screenshot({ path: "/tmp/clipsplat-brand-" + code + ".png", fullPage: true });
  }
  await p.locator("#language").selectOption("es");
  await p.reload();
  assert.equal(await p.locator("#language").inputValue(), "es");
  assert.equal(await p.locator("#intro-text").inputValue(), "Bienvenidos a este video");
  await p.locator("#language").selectOption("ar");
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await p.screenshot({ path: "/tmp/clipsplat-brand-mobile-ar.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS: DrawSplat purple palette, splat icon, TM, six languages, RTL, preference persistence, titles preserved, mobile layout; " + origin);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
