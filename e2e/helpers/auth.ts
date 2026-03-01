/**
 * Auth helpers for Playwright E2E tests.
 *
 * Uses the Supabase Admin API (service role key) to create/delete test users
 * so every test run starts with a fresh, isolated account.
 */

import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
}

export const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string
  email: string
  password: string
}

// ---------------------------------------------------------------------------
// Create a unique test user via Admin API
// ---------------------------------------------------------------------------

export async function createTestUser(): Promise<TestUser> {
  const email = `e2e-${Date.now()}@brova-test.invalid`
  const password = 'E2eTest1234!'

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  })

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`)
  }

  return { id: data.user.id, email, password }
}

// ---------------------------------------------------------------------------
// Delete test user + all their data
// ---------------------------------------------------------------------------

export async function cleanupTestUser(userId: string) {
  try {
    // Resolve org → store → clean child tables
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (org) {
      const { data: store } = await adminSupabase
        .from('stores')
        .select('id')
        .eq('organization_id', org.id)
        .single()

      if (store) {
        await Promise.all([
          adminSupabase.from('store_domains').delete().eq('store_id', store.id),
          adminSupabase.from('store_products').delete().eq('store_id', store.id),
          adminSupabase.from('store_settings').delete().eq('store_id', store.id),
          adminSupabase.from('store_contact').delete().eq('store_id', store.id),
          adminSupabase.from('store_components').delete().eq('store_id', store.id),
          adminSupabase.from('store_banners').delete().eq('store_id', store.id),
        ])
        await adminSupabase.from('stores').delete().eq('id', store.id)
      }

      await adminSupabase.from('organizations').delete().eq('id', org.id)
    }

    await adminSupabase.auth.admin.deleteUser(userId)
  } catch (err) {
    // Log but don't throw — cleanup failures shouldn't fail the test suite
    console.warn(`[cleanup] Failed to fully clean up user ${userId}:`, err)
  }
}

// ---------------------------------------------------------------------------
// Sign up a user via the UI
// ---------------------------------------------------------------------------

export async function signUpViaUI(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/en/signup')
  await page.locator('input[type="email"]').fill(email)
  // signup form has two password fields (password + confirm)
  const pwFields = page.locator('input[type="password"]')
  await pwFields.nth(0).fill(password)
  await pwFields.nth(1).fill(password)
  await page.locator('button[type="submit"]').click()
}

// ---------------------------------------------------------------------------
// Log in a user via the UI
// ---------------------------------------------------------------------------

export async function loginViaUI(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/en/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}
