/**
 * Auth Edge Cases Tests
 *
 * Tests authentication error handling and access control.
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser } from './helpers/auth'

// ---------------------------------------------------------------------------
// Test 1: Invalid credentials show error message
// ---------------------------------------------------------------------------

test('Auth: invalid password shows error', async ({ page }) => {
  const user = await createTestUser()

  try {
    await page.goto('/en/login')
    await page.locator('input[type="email"]').fill(user.email)
    await page.locator('input[type="password"]').fill('WrongPassword123!')
    await page.locator('button[type="submit"]').click()

    // Should show error message (stays on login page)
    await expect(
      page.getByText(/doesn't look right|invalid|incorrect/i)
    ).toBeVisible({ timeout: 8_000 })
    await expect(page).toHaveURL(/\/login/)
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Protected routes redirect unauthenticated users
// ---------------------------------------------------------------------------

test('Auth: /admin redirects unauthenticated user to login page', async ({ page }) => {
  await page.goto('/en/admin')
  // The app uses /admin-login for admin auth
  await expect(page).toHaveURL(/\/login|\/admin-login/, { timeout: 10_000 })
})

test('Auth: /start redirects unauthenticated user to login page', async ({ page }) => {
  await page.goto('/en/start')
  await expect(page).toHaveURL(/\/login|\/admin-login/, { timeout: 15_000 })
})

// ---------------------------------------------------------------------------
// Test 3: Signup with existing email shows error
// ---------------------------------------------------------------------------

test('Auth: signup with existing email shows error', async ({ page }) => {
  const user = await createTestUser()

  try {
    await page.goto('/en/signup')
    await page.locator('input[type="email"]').fill(user.email)
    const pwFields = page.locator('input[type="password"]')
    await pwFields.nth(0).fill('AnotherPassword123!')
    await pwFields.nth(1).fill('AnotherPassword123!')
    await page.locator('button[type="submit"]').click()

    // Should show "already exists" error
    await expect(
      page.getByText(/already exists|already registered|already have/i)
    ).toBeVisible({ timeout: 8_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})
