const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4182' },
  webServer: {
    command: 'python3 -m http.server 4182 --bind 127.0.0.1',
    cwd: '../..',
    url: 'http://127.0.0.1:4182/solutions/pdfsplat/',
    reuseExistingServer: true,
  },
});
