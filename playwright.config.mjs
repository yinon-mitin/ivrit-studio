import { defineConfig } from '@playwright/test';

// Viewports are the one-screen budgets from SPEC.md (Behaviour Contracts).
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.mjs',
  forbidOnly: true,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium-phone', use: { browserName: 'chromium', viewport: { width: 360, height: 640 }, hasTouch: true } },
    { name: 'chromium-laptop', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
    { name: 'webkit-iphone', use: { browserName: 'webkit', viewport: { width: 390, height: 664 }, hasTouch: true } },
  ],
});
