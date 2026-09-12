import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 2 : 0,
  // The html reporter is what writes playwright-report/, which CI uploads. Its
  // absence is why that artifact has always been empty.
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3101',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/auth\.setup\.ts/, /\.signed-in\.spec\.ts/],
    },
    {
      name: 'chromium-signed-in',
      testMatch: /\.signed-in\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/signed-in.json' },
      dependencies: ['setup'],
    },
  ],
});
