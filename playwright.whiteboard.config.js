const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  outputDir: '.tmp/whiteboard-test-results',
  testDir: './tests', testMatch: /whiteboard.*\.spec\.js/, timeout: 30_000,
  workers: 3, retries: 0,
  use: { baseURL: process.env.WHITEBOARD_URL || 'http://127.0.0.1:4183', storageState: { cookies: [], origins: [{ origin: new URL(process.env.WHITEBOARD_URL || 'http://127.0.0.1:4183').origin, localStorage: [{ name: 'drawsplat.entryRole', value: 'teacher' }] }] }, serviceWorkers: 'block', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: process.env.WHITEBOARD_URL ? undefined : { command: 'python3 -m http.server 4183 --bind 127.0.0.1', url: 'http://127.0.0.1:4183', reuseExistingServer: true },
});
