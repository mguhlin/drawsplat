import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
    permissions: ['microphone'],
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  },
  webServer: {
    command: 'python3 -m http.server 4179 --directory ../..',
    url: 'http://127.0.0.1:4179/solutions/audiosplat/',
    reuseExistingServer: true,
  },
});
