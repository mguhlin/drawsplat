import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: { command: "npm run dev", url: "http://127.0.0.1:5173/solutions/videosplat/", reuseExistingServer: true },
  use: { baseURL: "http://127.0.0.1:5173/solutions/videosplat/", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
