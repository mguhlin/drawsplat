const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: [
    "storage-resilience.spec.js",
    "graphsplat-equations.spec.js",
    "graphsplat.spec.js",
  ],
  timeout: 30000,
  outputDir: process.env.SPLATWORKS_AUDIT_OUTPUT || "./test-results/audit",
  projects: [
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  use: { baseURL: process.env.SPLATWORKS_URL || "http://127.0.0.1:4183" },
  webServer: process.env.SPLATWORKS_URL
    ? undefined
    : {
        command: "python3 -m http.server 4183 --bind 127.0.0.1",
        url: "http://127.0.0.1:4183/",
        reuseExistingServer: true,
      },
});
