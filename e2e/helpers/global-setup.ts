/**
 * Global test hooks for E2E suite.
 *
 * Adds a small delay between tests to avoid overwhelming
 * Supabase free-tier connection limits (ETIMEDOUT errors).
 */

import { test as base } from '@playwright/test'

export const test = base.extend({
  // Add a 1.5s cooldown after each test to let Supabase connections drain
  page: async ({ page }, use) => {
    await use(page)
    await new Promise((r) => setTimeout(r, 1_500))
  },
})

export { expect } from '@playwright/test'
