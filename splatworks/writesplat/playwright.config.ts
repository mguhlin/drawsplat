import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173/splatworks/writesplat/',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173/splatworks/writesplat/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
