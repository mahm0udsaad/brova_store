/**
 * Internationalization (i18n) Tests
 *
 * Tests locale switching between English and Arabic,
 * RTL layout, and content translation.
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, adminSupabase } from './helpers/auth'

async function seedActiveStore(userId: string) {
  const slug = `e2e-i18n-${Date.now()}`

  const { data: org } = await adminSupabase
    .from('organizations')
    .insert({ owner_id: userId, slug, name: 'i18n Test Store', type: 'standard' })
    .select('id, slug')
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .insert({
      organization_id: org!.id,
      slug: `store-${slug}`,
      name: 'i18n Test Store',
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

  await adminSupabase.from('store_products').insert({
    store_id: store!.id,
    name: 'English Product',
    name_ar: 'منتج عربي',
    slug: 'test-product',
    price: 100,
    inventory: 10,
    status: 'active',
    currency: 'SAR',
  })

  return { orgSlug: slug, storeId: store!.id }
}

// ---------------------------------------------------------------------------
// Test 1: English storefront shows English product names
// ---------------------------------------------------------------------------

test('i18n: English storefront shows English product names', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug } = await seedActiveStore(user.id)

  try {
    await page.goto(`http://${orgSlug}.localhost:3000/en`)
    await expect(page).not.toHaveURL(/404/)

    // English product name should be visible
    await expect(page.getByText('English Product')).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Arabic storefront shows Arabic product names
// ---------------------------------------------------------------------------

test('i18n: Arabic storefront shows Arabic product names', async ({ page }) => {
  const user = await createTestUser()
  const { orgSlug } = await seedActiveStore(user.id)

  try {
    await page.goto(`http://${orgSlug}.localhost:3000/ar`)
    await expect(page).not.toHaveURL(/404/)

    // Arabic product name should be visible
    await expect(page.getByText('منتج عربي')).toBeVisible({ timeout: 10_000 })
  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Login page available in both locales
// ---------------------------------------------------------------------------

test('i18n: login page renders in English', async ({ page }) => {
  await page.goto('/en/login')
  await expect(
    page.getByRole('heading', { name: /welcome back/i })
  ).toBeVisible({ timeout: 5_000 })
})

test('i18n: login page renders in Arabic', async ({ page }) => {
  await page.goto('/ar/login')
  await expect(
    page.getByRole('heading', { name: /مرحبًا بعودتك/ })
  ).toBeVisible({ timeout: 5_000 })
})
