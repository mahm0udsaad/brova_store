/**
 * Admin Product Management Tests
 *
 * Tests product CRUD via the admin API endpoints.
 * Uses authenticated API calls (browser cookies from login).
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, loginViaUI, adminSupabase } from './helpers/auth'

async function setupMerchantStore(userId: string) {
  const slug = `e2e-admin-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({ owner_id: userId, slug, name: 'Admin Test Store', type: 'standard' })
    .select('id')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: 'Admin Test Store',
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

  return { storeId: store!.id, orgId: org!.id }
}

// ---------------------------------------------------------------------------
// Test 1: Create product via API
// ---------------------------------------------------------------------------

test('Admin API: create product', async ({ page }) => {
  const user = await createTestUser()
  const { storeId } = await setupMerchantStore(user.id)

  try {
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/start|\/admin/, { timeout: 15_000 })

    // Create product via API using browser cookies
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Test Product',
          price: 199,
          inventory: 50,
          status: 'active',
        }),
      })
      return { status: res.status, body: await res.json() }
    })

    expect(result.status).toBe(201)
    expect(result.body.product).toBeTruthy()
    expect(result.body.product.name).toBe('E2E Test Product')

    // Verify in DB
    const { data: product } = await adminSupabase
      .from('store_products')
      .select('name, price, inventory')
      .eq('store_id', storeId)
      .eq('name', 'E2E Test Product')
      .single()

    expect(product!.price).toBe(199)
    expect(product!.inventory).toBe(50)
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: List products via API
// ---------------------------------------------------------------------------

test('Admin API: list products with pagination', async ({ page }) => {
  const user = await createTestUser()
  const { storeId } = await setupMerchantStore(user.id)

  try {
    // Seed some products
    await adminSupabase.from('store_products').insert([
      { store_id: storeId, name: 'Product A', slug: 'product-a', price: 100, inventory: 10, status: 'active', currency: 'SAR' },
      { store_id: storeId, name: 'Product B', slug: 'product-b', price: 200, inventory: 20, status: 'active', currency: 'SAR' },
      { store_id: storeId, name: 'Product C', slug: 'product-c', price: 300, inventory: 0, status: 'draft', currency: 'SAR' },
    ])

    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/start|\/admin/, { timeout: 15_000 })

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/admin/products?limit=10')
      return { status: res.status, body: await res.json() }
    })

    expect(result.status).toBe(200)
    expect(result.body.products.length).toBeGreaterThanOrEqual(3)
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Delete product via API
// ---------------------------------------------------------------------------

test('Admin API: delete product', async ({ page }) => {
  const user = await createTestUser()
  const { storeId } = await setupMerchantStore(user.id)

  try {
    const { data: product } = await adminSupabase
      .from('store_products')
      .insert({ store_id: storeId, name: 'To Delete', slug: 'to-delete', price: 50, inventory: 1, status: 'draft', currency: 'SAR' })
      .select('id')
      .single()

    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/start|\/admin/, { timeout: 15_000 })

    const result = await page.evaluate(async (productId) => {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      return { status: res.status }
    }, product!.id)

    // API should return 200 (success) — the delete goes through RLS
    expect(result.status).toBe(200)
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 4: Create and delete category via API
// ---------------------------------------------------------------------------

test('Admin API: category CRUD', async ({ page }) => {
  const user = await createTestUser()
  await setupMerchantStore(user.id)

  try {
    await loginViaUI(page, user.email, user.password)
    // Wait for auth redirect to complete (cookie is set after redirect)
    await expect(page).toHaveURL(/\/start|\/admin/, { timeout: 15_000 })

    // Create category
    const createResult = await page.evaluate(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Category', name_ar: 'فئة اختبارية' }),
      })
      return { status: res.status, body: await res.json() }
    })

    expect(createResult.status).toBe(201)
    const categoryId = createResult.body.category?.id
    expect(categoryId).toBeTruthy()

    // List categories
    const listResult = await page.evaluate(async () => {
      const res = await fetch('/api/admin/categories')
      return { status: res.status, body: await res.json() }
    })

    expect(listResult.status).toBe(200)
    expect(listResult.body.categories.some((c: any) => c.name === 'E2E Category')).toBe(true)

    // Delete category
    const deleteResult = await page.evaluate(async (id) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      return { status: res.status }
    }, categoryId)

    expect(deleteResult.status).toBe(200)
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 5: Unauthenticated request is rejected
// ---------------------------------------------------------------------------

test('Admin API: unauthenticated request returns 401', async ({ page }) => {
  // Don't login — just call the API directly
  await page.goto('http://localhost:3000/en')

  const result = await page.evaluate(async () => {
    const res = await fetch('/api/admin/products')
    return { status: res.status }
  })

  expect(result.status).toBe(401)
})
