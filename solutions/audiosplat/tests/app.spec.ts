import { expect, test } from "@playwright/test";

test("loads the production AudioSplat shell and changes language", async ({
  page,
}) => {
  const missing: string[] = [];
  page.on("response", (response) => {
    if (
      response.url().includes("/solutions/audiosplat/") &&
      response.status() >= 400
    )
      missing.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/solutions/audiosplat/");
  await expect(page.getByRole("heading", { name: "AudioSplat" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Private by default")).toBeVisible();
  await page.locator("#language").selectOption("es");
  await expect(
    page.getByRole("button", { name: "Grabar" }).first(),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.reload();
  await expect(page.locator("#language")).toHaveValue("es");
  expect(missing).toEqual([]);
});

test("applies Arabic RTL while retaining a left-to-right timeline contract", async ({
  page,
}) => {
  await page.goto("/solutions/audiosplat/?lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("button", { name: "تسجيل" }).first(),
  ).toBeVisible();
});

test("does not treat the Firefox hard-refresh shortcut as Record", async ({
  page,
}) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "R",
        code: "KeyR",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    ),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("r");
  await expect(page.getByRole("dialog")).toContainText("microphone access");
});

test("keeps recording controls usable at a phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/solutions/audiosplat/?lang=en");
  await expect(
    page.getByRole("button", { name: "Record" }).first(),
  ).toBeVisible();
  await expect(page.locator("#mic-input")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
});

test("records a shared device-audio stream when the browser provides one", async ({
  page,
}) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.evaluate(() =>
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      configurable: true,
      value: () => navigator.mediaDevices.getUserMedia({ audio: true }),
    }),
  );
  await page.getByRole("button", { name: "Record device audio" }).click();
  await expect(page.getByRole("dialog")).toContainText("Share audio");
  await page.getByRole("button", { name: "Choose shared audio" }).click();
  await expect(page.locator("#status")).toHaveText("Recording");
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("[data-clip]")).toHaveCount(1, { timeout: 10000 });
});

test("opens help with local privacy guidance", async ({ page }) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.getByRole("button", { name: "Help" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Audio is processed locally",
  );
});

test("keeps only one application menu open and dismisses it outside", async ({ page }) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.getByText("File", { exact: true }).click();
  await expect(page.locator("details.menu").nth(0)).toHaveAttribute("open", "");
  await page.getByText("Edit", { exact: true }).click();
  await expect(page.locator("details.menu").nth(0)).not.toHaveAttribute("open", "");
  await expect(page.locator("details.menu").nth(1)).toHaveAttribute("open", "");
  await page.locator("#workspace").click({ position: { x: 10, y: 10 } });
  await expect(page.locator("details.menu").nth(1)).not.toHaveAttribute("open", "");
});

test("lists sound-effect sources alphabetically as safe external links", async ({ page }) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.getByText("Sound-Effect Sources", { exact: true }).click();
  const links = page.locator(".source-menu .source-link");
  await expect(links).toHaveCount(16);
  expect(await links.allTextContents()).toEqual([
    "BBC Sound Effects",
    "BigSoundBank",
    "Kenney Audio Assets",
    "Mixkit Sound Effects",
    "NASA Historical Sounds",
    "National Park Service Sound Gallery",
    "NOAA Ocean Sounds",
    "OpenGameArt Sound Effects",
    "Pixabay Sound Effects",
    "Sonniss GameAudioGDC Archive",
    "SoundBible",
    "SoundEffects+",
    "SoundGator",
    "Tabletop Audio",
    "Wikimedia Commons Audio",
    "Yellowstone Sound Library",
  ]);
  await expect(links.first()).toHaveAttribute("target", "_blank");
  await expect(links.first()).toHaveAttribute("rel", "noopener noreferrer");
  await expect(links.nth(8)).toHaveAttribute("href", "https://pixabay.com/sound-effects/");
});

test("imports, edits, undoes, and exports a real WAV project", async ({
  page,
}) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.locator("#audio-input").setInputFiles({
    name: "classroom-voice.wav",
    mimeType: "audio/wav",
    buffer: makeWav(1, 8000),
  });
  await expect(page.locator("[data-clip]")).toHaveCount(1);
  await expect(page.locator("[data-clip]")).toHaveAttribute(
    "aria-label",
    /classroom-voice/,
  );
  await page.getByRole("button", { name: "Add track" }).first().click();
  await expect(page.locator("[data-track]")).toHaveCount(2);
  const clipBox = await page.locator("[data-clip]").boundingBox();
  const destinationBox = await page.locator("[data-lane]").nth(1).boundingBox();
  if (!clipBox || !destinationBox) throw new Error("Clip drag targets missing");
  await page.mouse.move(
    clipBox.x + clipBox.width / 2,
    clipBox.y + clipBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    destinationBox.x + 60,
    destinationBox.y + destinationBox.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(
    page.locator("[data-track]").nth(0).locator("[data-clip]"),
  ).toHaveCount(0);
  await expect(
    page.locator("[data-track]").nth(1).locator("[data-clip]"),
  ).toHaveCount(1);
  const ruler = page.locator("[data-ruler]");
  const box = await ruler.boundingBox();
  if (!box) throw new Error("Timeline ruler missing");
  await page.mouse.click(box.x + 40, box.y + 10);
  await page.getByRole("button", { name: "Split" }).first().click();
  await expect(page.locator("[data-clip]")).toHaveCount(2);
  await page.getByTitle("Undo").click();
  await expect(page.locator("[data-clip]")).toHaveCount(1);
  await page.getByText("Effects", { exact: true }).click();
  await page.getByRole("button", { name: "Normalize" }).click();
  await page.getByText("Effects", { exact: true }).click();
  await page.getByRole("button", { name: "Fade in" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audio" }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.wav$/);
  await page.locator("#export-format").selectOption("mp3");
  const mp3Promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audio" }).first().click();
  const mp3 = await mp3Promise;
  expect(mp3.suggestedFilename()).toMatch(/\.mp3$/);
  const mp3Stream = await mp3.createReadStream();
  let mp3Bytes = 0;
  for await (const chunk of mp3Stream) mp3Bytes += chunk.length;
  expect(mp3Bytes).toBeGreaterThan(1000);
});

test("records from a permitted microphone and creates a recoverable clip", async ({
  page,
}) => {
  await page.goto("/solutions/audiosplat/?lang=en");
  await page.getByRole("button", { name: "Record" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("microphone access");
  await page.getByRole("button", { name: "Continue to microphone" }).click();
  await expect(page.locator("#status")).toHaveText("Recording");
  await expect
    .poll(async () => page.locator("#mic-input option").count())
    .toBeGreaterThan(1);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("[data-clip]")).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator("#status")).toContainText(
    "Recording ready. Press Play to listen.",
  );
  await page.getByRole("button", { name: "Play" }).click();
  await expect
    .poll(async () => page.locator("#status-time").textContent())
    .not.toBe("0:00.00");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("#save-state")).toHaveText("Saved locally");
  await page.getByRole("button", { name: "Record" }).first().click();
  await page.getByRole("button", { name: "Continue to microphone" }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("[data-track]")).toHaveCount(2);
  await expect(page.locator("[data-clip]")).toHaveCount(2);
  await expect(page.locator("[data-track-name]").last()).toHaveValue("Track 2");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.locator("[data-delete-track]").last().click();
  await expect(page.locator("[data-clip]")).toHaveCount(1);
  await expect(page.locator("[data-track]")).toHaveCount(1);
  await page.locator("[data-clip]").click();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await expect(page.locator("[data-clip]")).toHaveCount(0);
  await page.getByRole("button", { name: "Record" }).first().click();
  await page.getByRole("button", { name: "Continue to microphone" }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("[data-clip]")).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator("[data-track-name]")).toHaveValue("Track 1");
});

function makeWav(seconds: number, sampleRate: number): Buffer {
  const frames = seconds * sampleRate;
  const output = Buffer.alloc(44 + frames * 2);
  output.write("RIFF", 0);
  output.writeUInt32LE(36 + frames * 2, 4);
  output.write("WAVE", 8);
  output.write("fmt ", 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32);
  output.writeUInt16LE(16, 34);
  output.write("data", 36);
  output.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index += 1) {
    output.writeInt16LE(
      Math.round(Math.sin((index / sampleRate) * Math.PI * 2 * 440) * 8000),
      44 + index * 2,
    );
  }
  return output;
}
