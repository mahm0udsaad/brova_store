import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load .env.local for test credentials
dotenv.config({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,            // 45s default (storefront pages can be slow on first load)
  fullyParallel: false,       // Tests create real DB records — run sequentially
  forbidOnly: !!process.env.CI,
  retries: 1,                      // Retry once — handles transient Supabase ETIMEDOUT
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['line']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
