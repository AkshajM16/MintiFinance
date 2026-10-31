import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', workers: 1, retries: 0, timeout: 45000,
  reporter: [['list'], ['json', { outputFile: 'results/playwright.json' }]],
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
