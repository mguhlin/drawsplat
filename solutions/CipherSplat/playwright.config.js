const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  use: { baseURL: 'http://127.0.0.1:8765' },
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    cwd: '../..',
    url: 'http://127.0.0.1:8765/solutions/CipherSplat/',
    reuseExistingServer: true,
  },
});
