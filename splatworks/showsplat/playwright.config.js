const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', outputDir: '/tmp/showsplat-test-results', timeout: 30000,
  use: { baseURL: process.env.SHOWSPLAT_URL || 'http://127.0.0.1:4183', trace: 'retain-on-failure' },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome'], launchOptions: {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
    {name: 'chromium-phone', use: {...devices['Pixel 7'], launchOptions: {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}}},
    {name: 'iphone-webkit', use: {...devices['iPhone 13']}},
  ],
  webServer: process.env.SHOWSPLAT_URL ? undefined : {
    command: 'python3 -m http.server 4183 --bind 127.0.0.1 --directory ../..',
    url: 'http://127.0.0.1:4183/splatworks/showsplat/', reuseExistingServer: true,
  },
});
