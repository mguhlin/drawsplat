const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("solution entry points use compact trademark text and expose localization", () => {
  const failures = [];
  const solutions = path.join(root, "solutions");

  for (const slug of fs.readdirSync(solutions)) {
    const entry = path.join(solutions, slug, "index.html");
    if (!fs.existsSync(entry)) continue;
    const html = fs.readFileSync(entry, "utf8");
    if (/http-equiv=["']refresh|location\.replace/.test(html)) continue;

    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    if (/DrawSplat/i.test(title) && !/DrawSplat(?:™|<sup)/i.test(title)) {
      failures.push(`${slug}: document title does not use the compact trademark`);
    }
    if (/DrawSplatTM|DrawSplat\(TM\)/.test(html)) {
      failures.push(`${slug}: contains a long-form trademark mark`);
    }

    const nativeI18n =
      /data-i18n-picker|id=["'](?:language|lang|i18nSwitcher)["']|app-language\.js|pdf-language-loader\.js/.test(html);
    const compiledNativeI18n =
      /assets\/index-/.test(html) &&
      fs.existsSync(path.join(solutions, slug, "src", "i18n.ts"));
    if (!nativeI18n && !compiledNativeI18n) {
      failures.push(`${slug}: has no language-switcher integration`);
    }
  }

  expect(failures).toEqual([]);
});

for (const [slug, english, spanish] of [
  ["CipherSplat", "Workspace", "Espacio de trabajo"],
  ["graphsplat", "Make data visible.", "Haz visibles los datos."],
  ["qrsplat", "Standard QR", "QR estándar"],
]) {
  test(`${slug} language switcher changes primary interface text`, async ({ page }) => {
    await page.goto(`/solutions/${slug}/`);
    const picker = page.locator(".ds-language-control select");
    await expect(picker).toBeVisible();
    await expect(page.locator("body")).toContainText(english);
    await picker.selectOption("es");
    await expect(page.locator("body")).toContainText(spanish);
  });
}
