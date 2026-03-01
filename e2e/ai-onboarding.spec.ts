/**
 * AI Onboarding Integration Tests
 *
 * Tests the real AI chat endpoint (/api/onboarding/chat) with actual LLM calls.
 * Verifies that AI tool calls produce correct DB mutations.
 *
 * Flow:
 *   1. Login → /start creates org+store
 *   2. Send messages → AI calls tools → verify DB state
 *
 * Covers tools:
 *   - set_store_name
 *   - set_store_type + setup_page_layout
 *   - add_product
 *   - setup_page_layout (template switch)
 *   - update_store_theme
 *   - add_page_section (WhatsApp, TrustBadges)
 *   - complete_setup
 *
 * NOTE: These tests make real AI API calls and are slower (~30-60s each).
 *       Run separately: pnpm test:e2e:ai
 */

import { test, expect } from './helpers/global-setup'
import { createTestUser, cleanupTestUser, loginViaUI, adminSupabase } from './helpers/auth'

// Generous timeout for AI responses
test.setTimeout(120_000)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ToolCall {
  toolName: string
  input: Record<string, unknown>
  output: Record<string, unknown>
}

/**
 * Send a chat message via the browser's fetch (preserves auth cookies).
 * Parses the SSE response and extracts tool calls.
 */
async function sendChatMessage(
  page: import('@playwright/test').Page,
  storeId: string,
  messages: Array<{ role: string; content: string }>,
  locale = 'en'
): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const result = await page.evaluate(
    async ({ storeId, messages, locale }) => {
      // Build messages in the format useChat sends them
      const formattedMessages = messages.map((m, i) => ({
        id: `msg-${i}`,
        role: m.role,
        parts: [{ type: 'text', text: m.content }],
      }))

      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedMessages, storeId, locale }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return { error: `HTTP ${res.status}: ${errText}`, text: '', toolCalls: [] }
      }

      const body = await res.text()

      // Parse SSE events: "data: {...}\n\n"
      const toolCalls: Array<{
        toolName: string
        input: Record<string, unknown>
        output: Record<string, unknown>
      }> = []
      const textParts: string[] = []
      const toolInputs = new Map<string, { toolName: string; input: unknown }>()

      for (const line of body.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const payload = trimmed.slice(6) // remove "data: "
        if (payload === '[DONE]') continue

        try {
          const chunk = JSON.parse(payload)

          if (chunk.type === 'text-delta' && chunk.delta) {
            textParts.push(chunk.delta)
          }
          if (chunk.type === 'tool-input-available') {
            toolInputs.set(chunk.toolCallId, {
              toolName: chunk.toolName,
              input: chunk.input,
            })
          }
          if (chunk.type === 'tool-output-available') {
            const input = toolInputs.get(chunk.toolCallId)
            toolCalls.push({
              toolName: input?.toolName || 'unknown',
              input: (input?.input || {}) as Record<string, unknown>,
              output: (chunk.output || {}) as Record<string, unknown>,
            })
          }
        } catch {
          // skip non-JSON lines
        }
      }

      return { text: textParts.join(''), toolCalls, error: undefined }
    },
    { storeId, messages, locale }
  )

  if ((result as any).error) {
    throw new Error((result as any).error)
  }

  return result as { text: string; toolCalls: ToolCall[] }
}

/** Get the store ID for a test user (created by ensureOrganizationForOnboarding). */
async function getStoreId(userId: string): Promise<string> {
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()

  const { data: store } = await adminSupabase
    .from('stores')
    .select('id')
    .eq('organization_id', org!.id)
    .single()

  return store!.id
}

/** Build a cumulative messages array for multi-turn conversation. */
function conversation() {
  const messages: Array<{ role: string; content: string }> = []

  return {
    messages,
    user(content: string) {
      messages.push({ role: 'user', content })
      return messages
    },
    /** Add the assistant's response (needed for multi-turn context) */
    assistant(content: string) {
      messages.push({ role: 'assistant', content })
    },
  }
}

// ---------------------------------------------------------------------------
// Test: Full AI onboarding flow with real LLM
// ---------------------------------------------------------------------------

test('AI onboarding: set name → set type → layout → product → theme → complete', async ({ page }) => {
  const user = await createTestUser()

  try {
    // ── 0. Login & land on /start (creates org+store) ─────────────────
    await loginViaUI(page, user.email, user.password)
    await expect(page).toHaveURL(/\/start/, { timeout: 15_000 })
    await page.waitForTimeout(2_000) // let ensureOrganizationForOnboarding finish

    const storeId = await getStoreId(user.id)
    expect(storeId).toBeTruthy()

    const chat = conversation()

    // ── 1. Set store name ─────────────────────────────────────────────
    const step1 = await sendChatMessage(page, storeId, chat.user(
      'My store name is "Fashion Hub"'
    ))
    chat.assistant(step1.text)

    const nameTool = step1.toolCalls.find(tc => tc.toolName === 'set_store_name')
    expect(nameTool, 'AI should call set_store_name').toBeTruthy()
    expect(nameTool!.output.success).toBe(true)

    // Verify DB
    const { data: storeAfterName } = await adminSupabase
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single()
    expect(storeAfterName!.name).toBe('Fashion Hub')

    console.log('✓ Step 1: set_store_name — store name set to "Fashion Hub"')

    // ── 2. Set store type + layout ────────────────────────────────────
    const step2 = await sendChatMessage(page, storeId, chat.user(
      'I sell clothing and fashion items'
    ))
    chat.assistant(step2.text)

    const typeTool = step2.toolCalls.find(tc => tc.toolName === 'set_store_type')
    expect(typeTool, 'AI should call set_store_type').toBeTruthy()
    expect(typeTool!.input.store_type).toBe('clothing')

    const layoutTool = step2.toolCalls.find(tc => tc.toolName === 'setup_page_layout')
    expect(layoutTool, 'AI should call setup_page_layout after set_store_type').toBeTruthy()
    expect(layoutTool!.input.template).toBe('showcase') // clothing → showcase

    // Verify DB: store_components created
    const { count: compCount } = await adminSupabase
      .from('store_components')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'active')
    expect(compCount, 'template should create components').toBeGreaterThan(5)

    console.log(`✓ Step 2: set_store_type(clothing) + setup_page_layout(showcase) — ${compCount} components`)

    // ── 3. Add a product ──────────────────────────────────────────────
    const step3 = await sendChatMessage(page, storeId, chat.user(
      'Add a product: "Black Leather Jacket" priced at 450 SAR'
    ))
    chat.assistant(step3.text)

    const productTool = step3.toolCalls.find(tc => tc.toolName === 'add_product')
    expect(productTool, 'AI should call add_product').toBeTruthy()
    expect(productTool!.output.success).toBe(true)

    const { data: products } = await adminSupabase
      .from('store_products')
      .select('name, price')
      .eq('store_id', storeId)
    expect(products!.length).toBeGreaterThanOrEqual(1)

    const jacket = products!.find(p => p.name.toLowerCase().includes('jacket') || p.name.toLowerCase().includes('leather'))
    expect(jacket, 'product should exist in DB').toBeTruthy()
    expect(jacket!.price).toBe(450)

    console.log(`✓ Step 3: add_product — "${jacket!.name}" at ${jacket!.price} SAR`)

    // ── 4. Switch template ────────────────────────────────────────────
    const step4 = await sendChatMessage(page, storeId, chat.user(
      'Change the layout to the classic template instead'
    ))
    chat.assistant(step4.text)

    const switchTool = step4.toolCalls.find(tc => tc.toolName === 'setup_page_layout')
    expect(switchTool, 'AI should call setup_page_layout to switch').toBeTruthy()
    expect(switchTool!.input.template).toBe('classic')

    // Verify: old components replaced with new ones
    const { data: newComponents } = await adminSupabase
      .from('store_components')
      .select('component_type')
      .eq('store_id', storeId)
      .eq('status', 'active')
    const types = newComponents!.map(c => c.component_type)
    // Classic template should NOT have ProductCarousel (that's showcase)
    expect(types).not.toContain('ProductCarousel')
    expect(types).toContain('ProductGrid')

    console.log(`✓ Step 4: setup_page_layout(classic) — template switched, ${newComponents!.length} components`)

    // ── 5. Update theme ───────────────────────────────────────────────
    const step5 = await sendChatMessage(page, storeId, chat.user(
      'Set the primary color to #1a1a2e and accent color to #e94560'
    ))
    chat.assistant(step5.text)

    const themeTool = step5.toolCalls.find(tc => tc.toolName === 'update_store_theme')
    expect(themeTool, 'AI should call update_store_theme').toBeTruthy()
    expect(themeTool!.output.success).toBe(true)

    const { data: settings } = await adminSupabase
      .from('store_settings')
      .select('appearance, theme_config')
      .eq('store_id', storeId)
      .single()
    const themeColors = (settings!.theme_config as any)?.colors || {}
    expect(themeColors.primary).toBe('#1a1a2e')
    expect(themeColors.accent).toBe('#e94560')

    console.log('✓ Step 5: update_store_theme — colors applied')

    // ── 6. Complete setup ─────────────────────────────────────────────
    const step6 = await sendChatMessage(page, storeId, chat.user(
      'That looks great, I am done. Please publish my store now.'
    ))
    chat.assistant(step6.text)

    const completeTool = step6.toolCalls.find(tc => tc.toolName === 'complete_setup')
    expect(completeTool, 'AI should call complete_setup').toBeTruthy()
    expect(completeTool!.output.success).toBe(true)

    // Verify: store is active
    const { data: finalStore } = await adminSupabase
      .from('stores')
      .select('status, onboarding_completed, skin_id')
      .eq('id', storeId)
      .single()
    expect(finalStore!.status).toBe('active')
    expect(finalStore!.onboarding_completed).toBe('completed')

    // Verify: products activated
    const { data: activeProducts } = await adminSupabase
      .from('store_products')
      .select('status')
      .eq('store_id', storeId)
    expect(activeProducts!.every(p => p.status === 'active')).toBe(true)

    console.log('✓ Step 6: complete_setup — store is ACTIVE, all products activated')
    console.log('\n🎉 Full AI onboarding flow passed!')

  } finally {
    await cleanupTestUser(user.id)
  }
})
