const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: 'backdropsplat.spec.mjs', workers: 1,
  timeout: 60_000, outputDir: '.tmp/backdropsplat/results',
  use: {
    baseURL: 'http://127.0.0.1:8792', browserName: process.env.BROWSER_NAME || 'chromium',
    launchOptions: process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH, args: ['--no-sandbox'] } : {},
    screenshot: 'only-on-failure', trace: 'retain-on-failure'
  },
  webServer: { command: 'python3 -m http.server 8792 --bind 127.0.0.1', url: 'http://127.0.0.1:8792/solutions/backdropsplat/', reuseExistingServer: !process.env.CI }
});
