import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  // Run projects sequentially to avoid parallel API seeding polluting the shared DB
  workers: 1,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.ts',
    },
    {
      name: 'e2e',
      testMatch: 'tests/e2e/**/*.spec.ts',
      use: {
        baseURL: 'http://localhost:5173',
      },
      dependencies: ['api'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
