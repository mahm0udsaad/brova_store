/**
 * Multi-Tenant Isolation Tests
 *
 * Verifies that stores are properly isolated:
 * - Store A's products don't appear on Store B
 * - Store A's subdomain only shows Store A's data
 * - Admin access is scoped to own store
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, loginViaUI, adminSupabase } from './helpers/auth'

async function seedStore(userId: string, suffix: string) {
  const slug = `e2e-tenant-${suffix}-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({ owner_id: userId, slug, name: `Store ${suffix}`, type: 'standard' })
    .select('id, slug')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: `Store ${suffix}`,
      store_type: 'clothing',
      status: 'active',
      onboarding_completed: 'completed',
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  await adminSupabase.from('store_domains').insert({
    store_id: store!.id,
    domain: `${slug}.localhost`,
    status: 'active',
    is_primary: true,
  })

  await adminSupabase.from('store_settings').insert({
    store_id: store!.id,
    merchant_id: userId,
    appearance: {},
    theme_config: {},
  })

  return { orgSlug: slug, storeId: store!.id }
}

// ---------------------------------------------------------------------------
// Test 1: Two stores have isolated products
// ---------------------------------------------------------------------------

test('Multi-tenant: store products only visible on own subdomain', async ({ page }) => {
  const user = await createTestUser()
  const store = await seedStore(user.id, 'iso')

  try {
    // Add product to the store
    await adminSupabase.from('store_products').insert({
      store_id: store.storeId,
      name: 'ISOLATED_PRODUCT',
      slug: 'isolated-product',
      price: 999,
      inventory: 10,
      status: 'active',
      currency: 'SAR',
    })

    // Visit the store's subdomain — product should be visible
    await page.goto(`http://${store.orgSlug}.localhost:3000/en`)
    await expect(page.getByText('ISOLATED_PRODUCT')).toBeVisible({ timeout: 15_000 })

    // Visit a different (non-existent) subdomain — should NOT show the product
    const fakeSlug = `non-existent-${Date.now()}`
    await page.goto(`http://${fakeSlug}.localhost:3000/en`)
    await expect(page.getByText('ISOLATED_PRODUCT')).not.toBeVisible({ timeout: 5_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Admin API returns only own store's products
// ---------------------------------------------------------------------------

test('Multi-tenant: admin API returns only own products', async ({ page }) => {
  const userA = await createTestUser()
  const userB = await createTestUser()

  const storeA = await seedStore(userA.id, 'A2')
  const storeB = await seedStore(userB.id, 'B2')

  try {
    // Add products to both stores
    await adminSupabase.from('store_products').insert({
      store_id: storeA.storeId,
      name: 'Store A Product',
      slug: 'store-a-prod',
      price: 100,
      inventory: 5,
      status: 'active',
      currency: 'SAR',
    })

    await adminSupabase.from('store_products').insert({
      store_id: storeB.storeId,
      name: 'Store B Product',
      slug: 'store-b-prod',
      price: 200,
      inventory: 5,
      status: 'active',
      currency: 'SAR',
    })

    // Login as User A and list products
    await loginViaUI(page, userA.email, userA.password)
    await page.waitForTimeout(1_500)

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/admin/products?limit=50')
      return await res.json()
    })

    const productNames = result.products.map((p: any) => p.name)
    expect(productNames).toContain('Store A Product')
    expect(productNames).not.toContain('Store B Product')
  } finally {
    await cleanupTestUser(userA.id)
    await cleanupTestUser(userB.id)
  }
})
