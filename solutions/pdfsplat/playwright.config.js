const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'iphone', testMatch: ['scan-phone.spec.js', 'touch-ink.spec.js'], use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4182' },
  webServer: {
    command: 'python3 -m http.server 4182 --bind 127.0.0.1',
    cwd: '../..',
    url: 'http://127.0.0.1:4182/solutions/pdfsplat/',
    reuseExistingServer: true,
  },
});
