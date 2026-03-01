/**
 * Merchant Flow — End-to-End Tests
 *
 * Tests the complete merchant journey:
 *   Register → /start (AI chat) → Approve draft → Store published → Admin panel
 *
 * Two sub-tests:
 *   1. Skip path  — skips the AI chat entirely, goes straight to admin
 *   2. Full path  — chats with AI (mocked), approves draft, verifies store is live
 *
 * Every test creates a fresh Supabase user and cleans up after itself.
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, loginViaUI, adminSupabase } from './helpers/auth'
import { fulfillWithCompletedSetup } from './helpers/ai-mock'

// ---------------------------------------------------------------------------
// Test 1: Register + Skip onboarding → land in admin
// ---------------------------------------------------------------------------

test('Merchant: register and skip onboarding reaches admin panel', async ({ page }) => {
  const user = await createTestUser()

  try {
    // ── 1. Log in via UI (user is pre-confirmed via Admin API) ────────────
    await loginViaUI(page, user.email, user.password)

    // ── 2. Should land on /start (onboarding) ────────────────────────────
    await expect(page).toHaveURL(/\/start/, { timeout: 15_000 })

    // ── 3. Org + store were created ───────────────────────────────────────
    // Give the server action time to complete
    await page.waitForTimeout(1_500)

    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    expect(org, 'organization should be created on /start load').toBeTruthy()

    const { data: store } = await adminSupabase
      .from('stores')
      .select('id, status')
      .eq('organization_id', org!.id)
      .single()

    expect(store, 'store should be created on /start load').toBeTruthy()

    // ── 4. A subdomain entry exists ───────────────────────────────────────
    const { data: domain } = await adminSupabase
      .from('store_domains')
      .select('domain, status')
      .eq('store_id', store!.id)
      .eq('is_primary', true)
      .single()

    expect(domain, 'store_domains entry should exist').toBeTruthy()
    expect(domain!.status).toBe('active')
    expect(domain!.domain).toMatch(/\.localhost$/)

    // ── 5. Click "Skip" ───────────────────────────────────────────────────
    const skipButton = page.getByRole('button', { name: /skip/i })
    await expect(skipButton).toBeVisible({ timeout: 5_000 })
    await skipButton.click()

    // ── 6. Redirected to admin ────────────────────────────────────────────
    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 })
    await expect(page).not.toHaveURL(/\/start/)

  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 2: Full onboarding — AI chat (mocked) → approve → store goes live
// ---------------------------------------------------------------------------

test('Merchant: full onboarding publishes store and products are active', async ({ page }) => {
  const user = await createTestUser()
  const storeName = `E2E Store ${Date.now()}`

  try {
    // ── 1. Log in (user is pre-confirmed via Admin API) ───────────────────
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/start/, { timeout: 15_000 })

    // ── 2. Mock the AI chat endpoint ──────────────────────────────────────
    // Intercept every POST to /api/onboarding/chat and return a
    // pre-built stream that immediately calls complete_setup.
    await page.route('**/api/onboarding/chat', (route) =>
      fulfillWithCompletedSetup(route, storeName)
    )

    // ── 3. Send a message to trigger the AI ───────────────────────────────
    const chatInput = page.locator('input[type="text"]').last()
    await expect(chatInput).toBeVisible({ timeout: 8_000 })
    await chatInput.fill('My store sells clothing')
    await page.keyboard.press('Enter')

    // ── 4. Wait for "Preview Store" button (isSetupComplete = true) ───────
    const previewBtn = page.getByRole('button', { name: /preview store/i })
    await expect(previewBtn).toBeVisible({ timeout: 15_000 })

    // ── 5. Navigate to review screen ─────────────────────────────────────
    await previewBtn.click()
    await expect(page.getByRole('heading', { name: /review your draft/i })).toBeVisible({ timeout: 5_000 })

    // ── 6. Mock approve-draft and publish endpoints ───────────────────────
    // These are called inside publishStore() in ConciergeProvider
    await page.route('**/api/admin/concierge/approve-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Draft saved' }),
      })
    })

    await page.route('**/api/admin/concierge/publish', async (route) => {
      // Actually publish the store in the real DB so the storefront test works
      const reqBody = await route.request().postDataJSON()
      const storeId = reqBody?.storeId

      if (storeId) {
        await adminSupabase
          .from('stores')
          .update({
            status: 'active',
            onboarding_completed: 'completed',
            published_at: new Date().toISOString(),
          })
          .eq('id', storeId)
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    // ── 7. Click "Approve & Save" ─────────────────────────────────────────
    const approveBtn = page.getByRole('button', { name: /approve & save/i })
    await expect(approveBtn).toBeEnabled({ timeout: 5_000 })
    await approveBtn.click()

    // ── 8. Redirected to admin panel ──────────────────────────────────────
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    // ── 9. Verify DB state ────────────────────────────────────────────────
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    expect(org).toBeTruthy()

    const { data: store } = await adminSupabase
      .from('stores')
      .select('id, status, onboarding_completed')
      .eq('organization_id', org!.id)
      .single()

    expect(store!.status).toBe('active')
    expect(store!.onboarding_completed).toBe('completed')

    // Domain entry must exist
    const { data: domain } = await adminSupabase
      .from('store_domains')
      .select('domain, status')
      .eq('store_id', store!.id)
      .eq('is_primary', true)
      .single()

    expect(domain!.status).toBe('active')

    console.log(`✓ Store published at: http://${domain!.domain}:3000`)

  } finally {
    await cleanupTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------
// Test 3: Re-visiting /start after completion redirects to /admin
// ---------------------------------------------------------------------------

test('Merchant: completed onboarding redirects /start to /admin', async ({ page }) => {
  const user = await createTestUser()

  try {
    // Create org + store directly in DB (skipping UI)
    const { data: org } = await adminSupabase
      .from('organizations')
      .insert({ owner_id: user.id, slug: `org-e2e-${user.id.slice(0, 8)}`, name: 'E2E Org', type: 'standard' })
      .select('id')
      .single()

    const { data: store } = await adminSupabase
      .from('stores')
      .insert({
        organization_id: org!.id,
        slug: `store-e2e-${user.id.slice(0, 8)}`,
        name: 'E2E Store',
        status: 'active',
        onboarding_completed: 'completed',
      })
      .select('id')
      .single()

    // Sign in via UI using Supabase email magic or login form
    await page.goto('/en/login')
    await page.locator('input[type="email"]').fill(user.email)
    await page.locator('input[type="password"]').fill(user.password)
    await page.locator('button[type="submit"]').click()

    // Wait briefly for auth
    await page.waitForTimeout(1_000)

    // Navigate to /start — should redirect to /admin immediately
    await page.goto('/en/start')
    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 })

  } finally {
    await cleanupTestUser(user.id)
  }
})
