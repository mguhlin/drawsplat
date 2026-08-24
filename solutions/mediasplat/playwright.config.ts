import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  webServer: { command: "npm run build && npm run preview -- --host 127.0.0.1", url: "http://127.0.0.1:4173/solutions/mediasplat/", reuseExistingServer: true },
  use: { baseURL: "http://127.0.0.1:4173/solutions/mediasplat/", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: "/usr/bin/google-chrome" } } }],
});
