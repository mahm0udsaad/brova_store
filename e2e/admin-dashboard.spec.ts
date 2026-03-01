/**
 * Admin Dashboard & Orders Tests
 *
 * Tests the admin panel pages load correctly for authenticated merchants.
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, loginViaUI, adminSupabase } from './helpers/auth'

async function setupMerchantWithStore(userId: string) {
  const slug = `e2e-dash-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({ owner_id: userId, slug, name: 'Dashboard Store', type: 'standard' })
    .select('id')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: 'Dashboard Store',
      status: 'active',
      onboarding_completed: 'completed',
    })
    .select('id')
    .single()

  await adminSupabase.from('store_settings').insert({
    store_id: store!.id,
    merchant_id: userId,
    appearance: {},
    theme_config: {},
  })

  await adminSupabase.from('store_products').insert([
    { store_id: store!.id, name: 'Prod 1', slug: 'prod-1', price: 100, inventory: 10, status: 'active', currency: 'SAR' },
    { store_id: store!.id, name: 'Prod 2', slug: 'prod-2', price: 200, inventory: 0, status: 'draft', currency: 'SAR' },
  ])

  return { storeId: store!.id, orgSlug: slug }
}

// ---------------------------------------------------------------------------
// Test 1: Admin dashboard loads with stats
// ---------------------------------------------------------------------------

test('Admin: dashboard loads and shows store name', async ({ page }) => {
  const user = await createTestUser()
  await setupMerchantWithStore(user.id)

  try {
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    // Use heading to avoid strict mode (store name appears in sidebar + heading)
    await expect(
      page.getByRole('heading', { name: /dashboard store/i })
    ).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Admin products page loads
// ---------------------------------------------------------------------------

test('Admin: products page lists products', async ({ page }) => {
  const user = await createTestUser()
  await setupMerchantWithStore(user.id)

  try {
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.goto('/en/admin/products')

    await expect(page.getByText(/products/i).first()).toBeVisible({ timeout: 10_000 })
    // Use .first() to avoid strict mode (product name in table row + link)
    await expect(page.getByText('Prod 1').first()).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Admin orders page loads (empty state)
// ---------------------------------------------------------------------------

test('Admin: orders page loads', async ({ page }) => {
  const user = await createTestUser()
  await setupMerchantWithStore(user.id)

  try {
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.goto('/en/admin/orders')

    await expect(page.getByText(/orders/i).first()).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})
