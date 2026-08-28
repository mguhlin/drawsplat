import { defineConfig, devices } from "@playwright/test";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173/solutions/videosplat/",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:4173/solutions/videosplat/",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
