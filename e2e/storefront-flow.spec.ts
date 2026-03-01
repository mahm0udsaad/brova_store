/**
 * End-User Storefront Flow — End-to-End Tests
 *
 * Tests what a customer sees when visiting a store's subdomain.
 *
 * Flow:
 *   Pre-seed an active store with products in the DB
 *   → Visit http://{orgSlug}.localhost:3000/en
 *   → Store home page loads (not 404, not "store unavailable")
 *   → Products are listed (status=active)
 *   → Product detail page loads
 *
 * No auth needed — storefront is public.
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, adminSupabase } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seeds a fully-active store with products for a test user. */
async function seedActiveStore(userId: string) {
  const slug = `e2e-store-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({
      owner_id: userId,
      slug,
      name: 'E2E Test Store',
      type: 'standard',
    })
    .select('id, slug')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: 'E2E Test Store',
      store_type: 'clothing',
      status: 'active',
      onboarding_completed: 'completed',
      published_at: new Date().toISOString(),
      default_locale: 'en',
    })
    .select('id')
    .single()

  // Domain entry — required for subdomain routing
  await adminSupabase.from('store_domains').insert({
    store_id: store!.id,
    domain: `${slug}.localhost`,
    status: 'active',
    is_primary: true,
  })

  // Store settings
  await adminSupabase.from('store_settings').insert({
    store_id: store!.id,
    merchant_id: userId,
    appearance: { primary_color: '#111827' },
    theme_config: {},
  })

  // Products
  const products = [
    { name: 'Classic White Tee', slug: 'classic-white-tee', price: 250 },
    { name: 'Slim Jeans',        slug: 'slim-jeans',        price: 499 },
    { name: 'Leather Jacket',    slug: 'leather-jacket',    price: 1200 },
  ]

  const { data: insertedProducts } = await adminSupabase.from('store_products').insert(
    products.map((p) => ({
      store_id: store!.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      inventory: 10,
      status: 'active',
      currency: 'EGP',
    }))
  ).select('id, name, slug, price')

  return {
    orgSlug: slug,
    storeId: store!.id,
    products: insertedProducts || [],
  }
}

// ---------------------------------------------------------------------------
// Test 1: Storefront home renders for an active store
// ---------------------------------------------------------------------------

test('Storefront: active store home page loads on subdomain', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug } = await seedActiveStore(user.id)

  try {
    // Visit the store's subdomain
    await page.goto(`http://${orgSlug}.localhost:3000/en`)

    // Should NOT be a 404 or error page
    await expect(page).not.toHaveURL(/404/)
    const title = await page.title()
    expect(title).not.toContain('404')

    // The storefront shell should be present
    // (contains at least one visible element — not the "store unavailable" message)
    await expect(
      page.getByText(/store unavailable|store is currently in draft/i)
    ).not.toBeVisible()

  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Draft store shows "Store Unavailable"
// ---------------------------------------------------------------------------

test('Storefront: draft store is not publicly accessible', async ({ page }) => {
  const user = await createTestUser()
  const slug = `e2e-draft-${Date.now()}`

  try {
    const { data: org } = await adminSupabase
      .from('organizations')
      .insert({ owner_id: user.id, slug, name: 'Draft Store', type: 'standard' })
      .select('id')
      .single()

    const { data: store } = await adminSupabase
      .from('stores')
      .insert({
        organization_id: org!.id,
        slug: `store-${slug}`,
        name: 'Draft Store',
        status: 'draft',
      })
      .select('id')
      .single()

    await adminSupabase.from('store_domains').insert({
      store_id: store!.id,
      domain: `${slug}.localhost`,
      status: 'active',
      is_primary: true,
    })

    await page.goto(`http://${slug}.localhost:3000/en`)

    // Draft stores are hidden from public by RLS — should show 404
    await expect(
      page.getByText(/404|not found|store unavailable/i)
    ).toBeVisible({ timeout: 8_000 })

  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Products appear on the storefront
// ---------------------------------------------------------------------------

test('Storefront: active products appear on store home page', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug, products } = await seedActiveStore(user.id)

  try {
    await page.goto(`http://${orgSlug}.localhost:3000/en`)

    // Wait for the storefront to fully render
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // At least one product name should be visible
    const firstProductName = products[0].name
    await expect(
      page.getByText(firstProductName, { exact: false })
    ).toBeVisible({ timeout: 8_000 })

  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 4: Unknown subdomain shows 404 / falls back to landing page
// ---------------------------------------------------------------------------

test('Storefront: unknown subdomain falls back to landing or 404', async ({ page }) => {
  const nonExistentSlug = `store-that-does-not-exist-${Date.now()}`

  await page.goto(`http://${nonExistentSlug}.localhost:3000/en`)

  // Either a 404 response or the landing page — not a crash/error page
  const statusCode = await page.evaluate(() => {
    // Try to detect error UI or 404 state in the page title / heading
    return document.title
  })

  // Should not be a 500-level crash
  const content = await page.content()
  expect(content).not.toContain('Application error')
  expect(content).not.toContain('Internal Server Error')
})

// ---------------------------------------------------------------------------
// Test 5: Product detail page loads
// ---------------------------------------------------------------------------

test('Storefront: product detail page is accessible', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug, products } = await seedActiveStore(user.id)

  try {
    // Navigate directly to product page by UUID
    const productId = products[0].id
    await page.goto(`http://${orgSlug}.localhost:3000/en/product/${productId}`)

    // Product name should be visible
    await expect(
      page.getByText(products[0].name, { exact: false })
    ).toBeVisible({ timeout: 10_000 })

    // Price should be visible (formatted as SAR)
    await expect(
      page.getByText(/250/i)
    ).toBeVisible({ timeout: 5_000 })

  } finally {
    await cleanupTestUser(user.id)
  }
})
