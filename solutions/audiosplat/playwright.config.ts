import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], permissions: ['microphone'], launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: {
      firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true },
    } } },
  ],
  webServer: {
    command: 'npm run build && python3 -m http.server 4179 --directory ../..',
    url: 'http://127.0.0.1:4179/solutions/audiosplat/',
    reuseExistingServer: true,
  },
});
