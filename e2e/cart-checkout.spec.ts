/**
 * Cart → Checkout → Order Flow Tests
 *
 * Tests the complete customer purchase journey:
 *   Add to cart → view cart → checkout form → place COD order → confirmation
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, adminSupabase } from './helpers/auth'

// Re-use the seedActiveStore helper from storefront tests
async function seedActiveStore(userId: string) {
  const slug = `e2e-cart-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({ owner_id: userId, slug, name: 'Cart Test Store', type: 'standard' })
    .select('id, slug')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: 'Cart Test Store',
      store_type: 'clothing',
      status: 'active',
      onboarding_completed: 'completed',
      published_at: new Date().toISOString(),
      default_locale: 'en',
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
    appearance: { primary_color: '#111827' },
    theme_config: {},
  })

  const { data: products } = await adminSupabase
    .from('store_products')
    .insert([
      { store_id: store!.id, name: 'Test Shirt', slug: 'test-shirt', price: 150, inventory: 10, status: 'active', currency: 'SAR' },
      { store_id: store!.id, name: 'Test Pants', slug: 'test-pants', price: 250, inventory: 5, status: 'active', currency: 'SAR' },
    ])
    .select('id, name, slug, price')

  return { orgSlug: slug, storeId: store!.id, products: products || [] }
}

// ---------------------------------------------------------------------------
// Test 1: Add product to cart from product detail page
// ---------------------------------------------------------------------------

test('Cart: add product from detail page shows cart badge', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug, products } = await seedActiveStore(user.id)

  try {
    const productId = products[0].id
    await page.goto(`http://${orgSlug}.localhost:3000/en/product/${productId}`)

    // Wait for product to load
    await expect(page.getByText('Test Shirt', { exact: false })).toBeVisible({ timeout: 10_000 })

    // Click "Add to Cart"
    const addBtn = page.getByRole('button', { name: /add to cart/i })
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
    await addBtn.click()

    // Should see "Added!" feedback
    await expect(page.getByText(/added/i)).toBeVisible({ timeout: 3_000 })

    // Floating cart badge should appear with count "1"
    await expect(page.getByLabel(/open cart/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel(/open cart/i)).toContainText('1')
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Full checkout flow — add to cart → checkout → place order
// ---------------------------------------------------------------------------

test('Cart: full checkout flow places COD order', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug, storeId, products } = await seedActiveStore(user.id)

  try {
    // ── 1. Add product to cart ─────────────────────────────────────────
    const productId = products[0].id
    await page.goto(`http://${orgSlug}.localhost:3000/en/product/${productId}`)
    await expect(page.getByText('Test Shirt')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /add to cart/i }).click()
    await expect(page.getByText(/added/i)).toBeVisible({ timeout: 3_000 })

    // ── 2. Navigate to checkout ────────────────────────────────────────
    await page.goto(`http://${orgSlug}.localhost:3000/en/checkout`)

    // Cart items should be visible in order summary
    await expect(page.getByText('Test Shirt')).toBeVisible({ timeout: 10_000 })

    // ── 3. Fill checkout form (use placeholders visible in the UI) ─────
    await page.getByPlaceholder(/john doe|محمد/i).fill('Test Customer')
    await page.getByPlaceholder(/5XX|966/i).fill('+966500000000')
    await page.getByPlaceholder(/king fahd|الملك فهد/i).fill('123 Test Street, Test District')
    await page.getByPlaceholder(/riyadh|الرياض/i).fill('Riyadh')

    // ── 4. Place order ─────────────────────────────────────────────────
    const placeOrderBtn = page.getByRole('button', { name: /place order/i })
    await expect(placeOrderBtn).toBeEnabled({ timeout: 5_000 })
    await placeOrderBtn.click()

    // ── 5. Should redirect to order confirmation ───────────────────────
    await expect(page).toHaveURL(/\/order-confirmed/, { timeout: 15_000 })
    await expect(page.getByText(/order confirmed/i)).toBeVisible({ timeout: 5_000 })

    // ── 6. Verify order in DB ──────────────────────────────────────────
    const { data: orders } = await adminSupabase
      .from('orders')
      .select('id, status, customer_name, customer_phone, payment_method, total')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(orders!.length).toBe(1)
    expect(orders![0].customer_name).toBe('Test Customer')
    expect(orders![0].payment_method).toBe('cod')
    expect(orders![0].status).toBe('pending')
  } finally {
    // Clean up orders too
    await adminSupabase.from('orders').delete().eq('store_id', storeId)
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Empty cart shows empty state on checkout
// ---------------------------------------------------------------------------

test('Cart: checkout with empty cart shows empty message', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug } = await seedActiveStore(user.id)

  try {
    await page.goto(`http://${orgSlug}.localhost:3000/en/checkout`)
    await expect(page.getByText(/cart.*empty|empty/i)).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})
