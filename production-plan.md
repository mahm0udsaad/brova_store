# BROVA — Phase 2 Coordination & Voice AI Correction

> **Date:** February 2026
> **Context:** All 3 agents completed Phase 1. This document provides the correction on voice AI scope, relays dependencies between agents, and assigns Phase 2 tasks.

---

## CRITICAL CORRECTION: Voice AI Scope

### ❌ OLD (Wrong)
Voice-to-voice ordering for **end customers** on the storefront. Customers speak to order products.

### ✅ NEW (Correct)
Voice AI is a **merchant dashboard tool** for **store owners**. It helps merchants manage their store hands-free using voice commands in Arabic.

**Why this matters:** The entire voice pipeline architecture stays the same (Groq STT → AI Agent → ElevenLabs TTS), but the system prompt, tools, UI location, and use cases change completely.

### Voice AI Use Cases (Store Owner, Not Customer)

| Use Case | Example Voice Command (Arabic) | AI Action |
|----------|-------------------------------|-----------|
| Add products | "أضف منتج جديد قميص أبيض بسعر ١٥٠ ريال" | Creates product via server action |
| Check orders | "كم طلب جديد اليوم؟" | Queries orders, reads summary aloud |
| Update inventory | "خلّص مخزون القميص الأزرق مقاس لارج" | Updates variant stock to 0 |
| Store analytics | "كم المبيعات هذا الأسبوع؟" | Queries analytics, speaks summary |
| Manage shipping | "وش حالة الشحنة رقم ١٢٣٤؟" | Checks shipment status |
| Bulk operations | "حدّث أسعار كل المنتجات زيادة ١٠٪" | Triggers bulk price update |
| Theme changes | "غيّر لون الخلفية أزرق غامق" | Updates theme colors |
| Customer support | "وش آخر شكوى من العملاء؟" | Reads recent customer messages |

### What Changes Per Agent

| Agent | What Changes |
|-------|-------------|
| **APUS** | System prompt becomes store-management focused (not shopping). Tools change from `addToCart/showProducts` to `createProduct/getOrders/updateInventory`. Voice UI moves to dashboard. |
| **CODEX** | Voice widget moves from storefront to dashboard. New page: `/dashboard/voice-assistant`. Remove voice from storefront components. |
| **SONNET** | No schema changes needed — same tables work. May need additional server actions for voice-triggered store management. |

---

---

# SECTION A — Relay to SONNET (Backend)

> Copy this into SONNET's session.

---

```
# PHASE 2 INSTRUCTIONS — SONNET

## Status Check
You completed Phase 1 successfully. Here's what CODEX and APUS built
so you know the current state:

CODEX delivered:
- RTL design system (base UI components)
- Theme rendering engine with ComponentNode[] tree
- ThemeRenderer component with component registry
- 3 starter templates (Fashion, Electronics, General)
- templates.ts with TODO(@SONNET) for server actions to load/save templates

APUS delivered:
- types/ai.ts (500+ lines of AI type definitions)
- lib/ai/config.ts (model routing & cost calculation)
- Voice commerce pipeline (lib/voice/stt.ts, tts.ts, session.ts)
- AI Shopping Assistant tools and streamUI integration
- Database tables: ai_usage_logs, voice_sessions, video_generation_tasks,
  social_media_connections (applied via Supabase MCP)

## CRITICAL CORRECTION: Voice AI Scope

The voice AI feature is for STORE OWNERS in the merchant dashboard,
NOT for end customers on the storefront. The pipeline architecture
stays the same (Groq STT → AI → ElevenLabs TTS) but the AI agent
manages the store instead of shopping. No schema changes needed for this.

## Phase 1 Loose Ends (Resolve BEFORE Phase 2)

### types/database.ts Generation Timeout

You reported that Supabase type generation timed out. This MUST be resolved
before Phase 2 because CODEX and APUS both depend on these types.

Action plan:
1. Retry: `npx supabase gen types typescript --project-id $PROJECT_ID > types/database.ts`
2. If it times out again, generate types locally using the Supabase CLI:
   `supabase gen types typescript --local > types/database.ts`
3. If local also fails, manually create types/database.ts based on your
   migration files. Cover at minimum:
   - stores, products, product_variants, product_images
   - categories, collections, collection_products
   - orders, order_items, order_status_history
   - customers, carts, cart_items
   - store_settings, theme_configurations
   - ai_usage_logs, voice_sessions, video_generation_tasks, social_media_connections
4. Output the complete types/database.ts file so I can give it to CODEX and APUS.

This is BLOCKING — do this first before anything else in Phase 2.

### APUS Created Database Tables via Supabase MCP — Conflict Check

APUS applied these tables directly via Supabase MCP during Phase 1:
- ai_usage_logs
- voice_sessions
- video_generation_tasks
- social_media_connections
- Enhanced shopping carts columns for AI assistant

You (SONNET) are the DB schema owner. You need to:
1. Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
   to see the full current state of the database
2. Check if APUS's tables have proper RLS policies (they may not — APUS
   is not the RLS expert)
3. Check if APUS's tables conflict with or duplicate any of your tables
4. If there are issues:
   - Write corrective migrations to fix RLS, add missing indexes, or
     rename columns for consistency
   - Report what you fixed so I can tell APUS
5. If everything looks clean, confirm it in your output
6. IMPORTANT: Going forward, ALL schema changes go through you (SONNET).
   APUS should not apply migrations directly. Relay this rule.

Include the audit results in your output.

---

## Your Phase 2 Tasks

### 1. Theme System Server Actions (CODEX is waiting on these)

CODEX created a templates.ts file with this TODO for you:
// TODO(@SONNET): Provide server actions to load/save ComponentNode[] templates per store.

Build these Server Actions in actions/theme.ts:

- getThemeConfig(storeId: string): Promise<ComponentNode[]>
  → Read from theme_configurations table
  → Return the component tree JSON

- saveThemeConfig(storeId: string, config: ComponentNode[]): Promise<void>
  → Upsert into theme_configurations table
  → Validate with Zod before saving

- applyTemplate(storeId: string, templateId: string): Promise<ComponentNode[]>
  → Load a starter template's ComponentNode[] config
  → Save it as the store's active theme
  → Return the applied config

- addComponent(storeId: string, sectionId: string, componentType: string, config: object): Promise<ComponentNode>
  → Add a new component to the store's theme tree
  → Return the created node with generated ID

- removeComponent(storeId: string, componentId: string): Promise<void>
  → Remove a component from the theme tree

- updateComponent(storeId: string, componentId: string, updates: object): Promise<ComponentNode>
  → Partial update a component's config

- reorderComponents(storeId: string, sectionId: string, newOrder: string[]): Promise<void>
  → Reorder components within a section

Use the ComponentNode interface from types/theme.ts (owned by CODEX).
Import it — do not redefine it.

### 2. Product Variant Server Actions

Build in actions/product-variants.ts:

- getVariants(productId: string): Promise<ProductVariant[]>
- createVariant(productId: string, data: VariantInput): Promise<ProductVariant>
- updateVariant(variantId: string, data: Partial<VariantInput>): Promise<ProductVariant>
- deleteVariant(variantId: string): Promise<void>
- updateVariantStock(variantId: string, quantity: number): Promise<void>

### 3. Voice-Triggered Store Management Actions

APUS needs these server actions for the voice AI assistant (dashboard, NOT storefront).
The voice AI agent will call these as tools:

- getDashboardSummary(storeId: string): Promise<DashboardSummary>
  → Returns: today's orders count, revenue, new customers, low stock alerts

- getRecentOrders(storeId: string, limit?: number): Promise<Order[]>
  → Returns: last N orders with status

- quickCreateProduct(storeId: string, data: QuickProductInput): Promise<Product>
  → Simplified product creation (name, price, optional description)
  → For voice commands like "add a product called X at Y price"

- bulkUpdatePrices(storeId: string, adjustmentType: 'percentage' | 'fixed', amount: number, filter?: ProductFilter): Promise<{ updated: number }>
  → For voice commands like "increase all prices by 10%"

- getStoreAnalytics(storeId: string, period: 'today' | 'week' | 'month'): Promise<AnalyticsSummary>
  → Revenue, orders, top products, conversion rate

### 4. Answer Your Own Questions

Regarding your Phase 1 questions:
- YES, proceed with Phase 2 (theme system) — CODEX has defined ComponentNode
- YES, build product variant server actions now
- Retry type generation — if it times out again, manually create types/database.ts
  based on the schema you've already migrated
- Cart session strategy (client-side UUID in localStorage) is acceptable — proceed with it

### 5. Middleware Update

Add to middleware.ts:
- Protected route check for /dashboard/* (require authenticated merchant)
- Store ID resolution from auth session for all /api/ routes
- Rate limiting headers for AI endpoints (X-RateLimit-Remaining)

## Output
Provide all new files with full content. List any new TODO comments
you leave for CODEX or APUS.
```

---

---

# SECTION B — Relay to CODEX (Frontend)

> Copy this into CODEX's session.

---

```
# PHASE 2 INSTRUCTIONS — CODEX

## Status Check
You completed Phase 1 successfully. Here's what SONNET and APUS built:

SONNET delivered:
- 6 new database tables (carts, cart_items, collections, collection_products,
  product_variants, product_images) with RLS
- Server Actions: lib/actions/cart.ts (6 functions), lib/actions/collections.ts (9 functions)
- types/api.ts (350 lines, 50+ TypeScript interfaces)
- SONNET-BACKEND-HANDOFF.md (complete API reference)

APUS delivered:
- types/ai.ts (AI tool schemas and response types)
- lib/ai/config.ts (model routing)
- Voice pipeline (STT + TTS + session management)
- AI Shopping Assistant with streamUI tools
- Database tables for AI usage, voice sessions, video tasks

## CRITICAL CORRECTION: Voice AI Scope

The voice AI feature is for STORE OWNERS in the merchant dashboard,
NOT for end customers on the storefront.

What this means for you:
- REMOVE any voice/microphone UI from storefront components
- ADD a voice assistant widget to the dashboard layout
- The AI Shopping Assistant in the storefront stays as TEXT CHAT ONLY
- New page needed: /dashboard/voice-assistant

## Phase 1 Loose Ends (Resolve BEFORE Phase 2)

### Modified Files in Git Status You Didn't Touch

You flagged that you saw many modified files in git status that you didn't
touch (admin assistant, concierge, etc.). Here's the clarification:

Those files are PRE-EXISTING code from the app before the 3-agent system
was set up. They are NOT from another agent. Here's how to handle them:

1. DO NOT modify or delete any file you didn't create — those are existing
   app features that may still be in use
2. If an existing file conflicts with something you need to build (same
   filename, same component name, overlapping functionality), TELL ME
   and I'll decide whether to replace it or integrate with it
3. For your Phase 2 work, create NEW files in the locations specified
   in your prompt. If a file already exists at that path, read it first
   and extend it rather than overwriting
4. Specifically for these existing modules:
   - admin assistant → This is a DIFFERENT feature from the AI Store Builder.
     Leave it alone unless I say otherwise
   - concierge → This is a DIFFERENT feature. Leave it alone.
   - Any other pre-existing dashboard pages → Leave them. Add your new
     pages alongside them in the routing structure

If you encounter any specific file conflicts during Phase 2, list them
in your output and I'll resolve them.

---

## Your Phase 2 Tasks

### 1. Remaining Storefront Components

Your Phase 1 audit noted these are still missing. Build them now:

- ProductDetail — Full product page with:
  - Image gallery (swipeable on mobile)
  - Variant selector (size, color)
  - Quantity picker
  - Add to cart button
  - Product description with tabs (description, specs, reviews)
  - Related products section
  - Uses: getProduct() from SONNET, addToCart() from SONNET

- CategoryBrowser — Visual category navigation:
  - Grid layout with category images
  - Supports nested categories
  - RTL-aware breadcrumbs

- ShippingCalculator — Delivery cost estimator:
  - City/region selector
  - Weight-based calculation display
  - Estimated delivery time
  - // TODO(@SONNET): getShippingRates(storeId, city, weight)

- CartDrawer — Slide-over cart panel:
  - Opens from the side (end side in RTL = left side)
  - Cart item list with quantity controls
  - Subtotal, shipping estimate, total
  - Proceed to checkout button
  - Uses: getCart(), updateCartItem(), removeFromCart() from SONNET

- CheckoutFlow — Multi-step checkout:
  - Step 1: Customer info (name, phone, email, address)
  - Step 2: Shipping method selection
  - Step 3: Payment method selection (show available providers)
  - Step 4: Order review and confirmation
  - Uses: createOrder() from SONNET
  - // TODO(@APUS): Payment provider UI components

- AIShoppingAssistant — Text chat widget for storefront:
  - Floating chat button (bottom-end corner in RTL)
  - Chat panel with message history
  - Renders generative UI components from APUS's streamUI
  - TEXT ONLY — no voice in storefront
  - // TODO(@APUS): Chat endpoint URL and message format

### 2. Dashboard Voice Assistant Page

NEW PAGE: app/[locale]/(dashboard)/dashboard/voice-assistant/page.tsx

Build a voice assistant UI for store owners:

- Large microphone button (press-and-hold or toggle)
- Waveform visualization during recording
- Transcription display (shows what the AI heard)
- AI response display (text + any UI cards for actions taken)
- Audio playback of AI response (auto-play)
- "Use Text Instead" input field as fallback
- History of recent voice commands (scrollable)
- Status indicators: "Listening...", "Processing...", "Speaking..."

Layout:
- Full page within dashboard layout (sidebar stays visible)
- Mobile-optimized: microphone button takes center stage
- RTL-aware: response cards flow right-to-left

Wire up to APUS's voice pipeline:
- // TODO(@APUS): POST /api/voice/dashboard endpoint
- // TODO(@APUS): Voice session management hooks

### 3. Dashboard Pages (Phase 2 set)

Build these dashboard pages that were planned for Week 2-3:

- /dashboard/theme — Visual theme editor:
  - Component list sidebar (all available components)
  - Drag-and-drop to add/reorder components
  - Click component to edit its config
  - Live preview panel (iframe or inline)
  - Template selector (Fashion, Electronics, General)
  - Color picker for theme palette
  - Font selector for typography
  - Uses: getThemeConfig(), addComponent(), removeComponent(),
    updateComponent(), reorderComponents(), applyTemplate() from SONNET

- /dashboard/marketing — Marketing hub:
  - Video generation panel:
    - Product selector
    - Prompt input for video style
    - Aspect ratio selector (9:16 or 16:9)
    - Generation status tracker
    - Video preview and download
    - // TODO(@APUS): generateProductVideo() function
  - Social media connections:
    - Connect TikTok / Instagram / Facebook buttons
    - Connection status indicators
    - Post scheduling UI (future phase)
    - // TODO(@APUS): Social OAuth flow handlers

### 4. Store Builder Split-Screen (Enhancement)

If the store builder split-screen exists from Phase 1, enhance it:
- Left panel: Chat with AI store builder (text)
- Right panel: Live preview with real ComponentNode[] rendering
- Template quick-start buttons at the top of chat
- "Apply to my store" button to save the builder's output

If it doesn't exist yet, build the full split-screen:
- app/[locale]/(dashboard)/dashboard/store-builder/page.tsx
- Resizable split panels
- Chat panel with AI message rendering
- Preview panel rendering ThemeRenderer with live config
- // TODO(@APUS): Store builder chat endpoint

## Constraints (Same as Phase 1)

- NEVER use pl/pr/ml/mr — always ps/pe/ms/me
- NEVER hardcode strings — use next-intl t()
- ALL new components need skeleton loaders
- Server Components by default, "use client" only when needed

## Output
Provide all new files with full content. List any new TODO comments
you leave for SONNET or APUS.
```

---

---

# SECTION C — Relay to APUS (AI & Integrations)

> Copy this into APUS's session.

---

```
# PHASE 2 INSTRUCTIONS — APUS

## Status Check
You completed Phase 1 successfully. Here's what SONNET and CODEX built:

SONNET delivered:
- 6 new database tables with RLS (carts, cart_items, collections,
  collection_products, product_variants, product_images)
- Server Actions: cart.ts (6 functions), collections.ts (9 functions)
- types/api.ts (50+ TypeScript interfaces)

CODEX delivered:
- RTL design system (base UI components)
- Theme rendering engine with ComponentNode[] tree
- 3 starter templates (Fashion, Electronics, General)
- ThemeRenderer, component registry
- TODOs for you: Missing AI Shopping Assistant component, generative UI rendering

---

## ⚠️ CRITICAL CORRECTION: Voice AI Scope Change

The voice AI feature is for STORE OWNERS in the merchant dashboard,
NOT for end customers on the storefront.

### What You Must Change

1. REWRITE the voice pipeline system prompt entirely:
   - OLD: "You are a shopping assistant helping customers browse and buy products"
   - NEW: "You are a store management assistant helping the merchant manage
     their store hands-free using voice commands in Arabic"

2. REPLACE the voice AI tools completely:
   - REMOVE: showProducts(), addToCart(), compareProducts() (customer tools)
   - ADD: store management tools (see below)

3. MOVE the voice endpoint:
   - OLD: POST /api/voice/transcribe (storefront)
   - NEW: POST /api/voice/dashboard (merchant dashboard, requires auth)

4. The storefront AI Shopping Assistant stays as TEXT CHAT ONLY.
   Remove any voice/audio capability from the storefront chat.

### New Voice AI Tools (Store Management)

Replace the voice tools in lib/ai/shopping-assistant/ or create
a new lib/ai/dashboard-assistant/ module:

Tools the merchant voice AI can call:

getDashboardSummary()
  → "كم الطلبات اليوم؟" → Calls SONNET's getDashboardSummary()
  → Speaks: "عندك ١٢ طلب جديد اليوم، إجمالي المبيعات ٤,٥٠٠ ريال"

getRecentOrders(limit)
  → "وش آخر الطلبات؟" → Calls SONNET's getRecentOrders()
  → Speaks: "آخر طلب من أحمد، قميص أبيض ومقاس لارج، بـ ١٥٠ ريال، حالته قيد التجهيز"

quickCreateProduct(name, price, description?)
  → "أضف منتج جديد حذاء رياضي بـ ٣٠٠ ريال" → Calls SONNET's quickCreateProduct()
  → Speaks: "تم إضافة المنتج حذاء رياضي بسعر ٣٠٠ ريال"

updateProductStock(productName, variant?, quantity)
  → "خلّص مخزون القميص الأزرق مقاس لارج" → Calls SONNET's updateVariantStock()
  → Speaks: "تم تحديث المخزون، القميص الأزرق مقاس لارج الحين نفد"

bulkUpdatePrices(adjustmentType, amount, filter?)
  → "ارفع الأسعار كلها ١٠٪" → Calls SONNET's bulkUpdatePrices()
  → Speaks: "تم رفع أسعار ٤٥ منتج بنسبة ١٠٪"

getStoreAnalytics(period)
  → "كم المبيعات هذا الأسبوع؟" → Calls SONNET's getStoreAnalytics()
  → Speaks: "مبيعات هذا الأسبوع ١٢,٣٤٠ ريال، ٨٩ طلب، أكثر منتج مبيعاً القميص الأبيض"

updateThemeColors(palette)
  → "غيّر لون الخلفية أزرق غامق" → Calls SONNET's updateThemeConfig()
  → Speaks: "تم تغيير لون الخلفية"

### New System Prompt (Arabic Store Management)

Write the system prompt in Arabic with English fallback:

"أنت مساعد ذكي لإدارة المتجر الإلكتروني على منصة بروڤا.
 أنت تساعد صاحب المتجر بإدارة منتجاته وطلباته ومتجره عن طريق الأوامر الصوتية.
 تكلم بالعربي بلهجة سعودية واضحة ومهنية.
 إذا ما فهمت الأمر، اطلب توضيح بطريقة لطيفة.
 لا تسوي أي عملية حذف بدون تأكيد من صاحب المتجر."

Key rules for the system prompt:
- Saudi dialect but professional (not too casual)
- ALWAYS confirm destructive operations (delete, bulk update) before executing
- Read back numbers clearly (use Arabic words for amounts when speaking)
- If confidence in transcription is <70%, ask the merchant to repeat or type
- Support mixed Arabic/English (merchants may use English product names)

## Phase 1 Loose Ends (Resolve BEFORE Phase 2)

### Which Phase 1 Files to Delete vs. Rewrite vs. Keep

The voice AI scope changed from customer-facing to merchant-facing.
Here's the explicit file-by-file decision for your Phase 1 deliverables:

FILES TO KEEP (no changes needed):
- types/ai.ts → KEEP. The type definitions are still valid. Add new
  dashboard assistant types alongside existing ones.
- lib/ai/config.ts → KEEP. Model routing is unchanged.
- lib/voice/stt.ts → KEEP. Groq Whisper STT works the same regardless
  of who's speaking (merchant or customer). No changes needed.
- lib/voice/tts.ts → KEEP. ElevenLabs TTS works the same. No changes.

FILES TO REWRITE (keep the file, replace the content):
- lib/voice/session.ts → REWRITE. The pipeline orchestration stays but:
  - Change the AI agent from shopping assistant to dashboard assistant
  - Change the tools from customer tools to merchant management tools
  - Add auth check (must be authenticated merchant, not anonymous customer)
  - Update the system prompt to merchant-facing Arabic

FILES TO CREATE NEW (don't modify old ones):
- lib/ai/dashboard-assistant/ → NEW directory. Build the merchant voice
  AI as a separate module from the shopping assistant.
  - lib/ai/dashboard-assistant/index.ts
  - lib/ai/dashboard-assistant/tools.ts
  - lib/ai/dashboard-assistant/prompts.ts
  - lib/ai/dashboard-assistant/types.ts
- app/api/voice/dashboard/route.ts → NEW endpoint for merchant voice

FILES TO LEAVE ALONE (existing shopping assistant stays as-is):
- lib/ai/shopping-assistant/ → KEEP as-is for storefront TEXT chat.
  Do NOT add voice to it. Do NOT change its tools.
  Just confirm its API contract so CODEX can build the chat widget.

### Database Tables You Applied via Supabase MCP

You applied tables directly via Supabase MCP in Phase 1:
- ai_usage_logs, voice_sessions, video_generation_tasks, social_media_connections

GOING FORWARD: All database schema changes must go through SONNET.
You should NOT apply migrations directly via Supabase MCP anymore.

SONNET is auditing your tables in Phase 2 to check for:
- Missing RLS policies
- Missing indexes
- Column naming consistency
- Conflicts with SONNET's tables

If SONNET reports issues, I'll relay the fixes to you. For now,
do not modify any database tables — focus on application code only.

---

## Your Phase 2 Tasks

### 1. Dashboard Voice Assistant (Rewrite)

Restructure the voice pipeline for merchant use:

Create lib/ai/dashboard-assistant/:
- index.ts — Main orchestrator (STT → AI → TTS pipeline)
- tools.ts — Store management tool definitions (listed above)
- prompts.ts — Arabic system prompts for store management
- types.ts — Dashboard assistant specific types

Create app/api/voice/dashboard/route.ts:
- POST endpoint for voice commands
- Requires authenticated merchant (check auth session)
- Accepts: audio blob (webm) + storeId
- Returns: { transcription, aiResponse, audioUrl, actions[] }
- Log all voice interactions to ai_usage_logs

### 2. Storefront AI Shopping Assistant (Text Only)

Keep the existing shopping assistant but ensure:
- It's TEXT ONLY — no voice, no audio
- It works as a chat widget in the storefront
- Tools: showProducts(), addToCart(), compareProducts(), getOrderStatus()
- System prompt stays customer-facing and Arabic-first
- Endpoint: POST /api/ai/chat (separate from voice/dashboard)

CODEX is building the AIShoppingAssistant component to render your
streamUI responses. Confirm the response format:
- What props does the chat component need?
- What's the message format? (role, content, toolInvocations?)
- What URL should the component POST to?

Leave a clear interface definition in types/ai.ts for CODEX.

### 3. Store Builder Agent

Build the AI agent for the store builder (split-screen in dashboard):

Create lib/ai/store-builder/:
- index.ts — Store builder chat orchestrator
- tools.ts — Theme manipulation tools
- prompts.ts — Onboarding conversation prompts

Endpoint: POST /api/ai/store-builder
- Accepts: messages[], storeId
- AI can call: addComponent(), removeComponent(), updateComponent(),
  reorderComponents(), updateThemeColors(), updateTypography()
- Each tool call triggers SONNET's theme server actions
- Response streams to CODEX's split-screen chat panel

### 4. Remaining Phase 2 Items

If time allows, start these:

- Bulk AI Operations (lib/ai/bulk/):
  - bulkGenerateDescriptions(storeId, productIds[])
  - bulkTranslate(storeId, productIds[], targetLang)
  - bulkGenerateSEO(storeId, productIds[])
  - Use Gemini 2.0 Flash for cost efficiency
  - Progress tracking via Supabase Realtime

- Video Generation (lib/video/):
  - Start Kling AI integration if API key is available
  - If not, build the interface with mock responses

## Dependencies on SONNET (Phase 2)

You need these server actions from SONNET. They are being built now:

- getDashboardSummary(storeId) → DashboardSummary
- getRecentOrders(storeId, limit) → Order[]
- quickCreateProduct(storeId, data) → Product
- bulkUpdatePrices(storeId, type, amount, filter) → { updated: number }
- getStoreAnalytics(storeId, period) → AnalyticsSummary
- getThemeConfig(storeId) → ComponentNode[]
- updateThemeConfig(storeId, config) → void
- addComponent(storeId, sectionId, type, config) → ComponentNode
- removeComponent(storeId, componentId) → void
- updateComponent(storeId, componentId, updates) → ComponentNode

If these aren't ready yet, write your code against the TypeScript
interfaces and add TODO(@SONNET) comments.

## Output
Provide all new/modified files with full content. Clearly mark what
changed from Phase 1 vs. what's new. List any TODO comments for
SONNET or CODEX.
```

---

---

# Quick Reference: Who Does What in Phase 2

| Task | Owner | Depends On | Priority |
|------|-------|-----------|----------|
| Theme server actions (load/save/add/remove) | SONNET | CODEX's ComponentNode type | 🔴 High |
| Product variant server actions | SONNET | None | 🟡 Medium |
| Voice management server actions | SONNET | None | 🔴 High |
| Middleware auth + rate limiting | SONNET | None | 🟡 Medium |
| Remaining storefront components (6) | CODEX | SONNET's server actions | 🔴 High |
| Dashboard voice assistant page | CODEX | APUS's voice endpoint | 🔴 High |
| Dashboard theme editor page | CODEX | SONNET's theme actions | 🟡 Medium |
| Dashboard marketing page | CODEX | APUS's video/social | 🟢 Low |
| Voice AI rewrite (merchant tools) | APUS | SONNET's management actions | 🔴 High |
| Storefront chat (text only, confirm API) | APUS | None | 🔴 High |
| Store builder agent | APUS | SONNET's theme actions | 🟡 Medium |
| Bulk AI operations | APUS | None | 🟢 Low |

## Execution Order

1. **First (all 3 parallel):** Give all agents their sections → each resolves Phase 1 loose ends
   - SONNET: Fix types/database.ts + verify APUS's tables
   - CODEX: Report modified files in git status
   - APUS: List files to keep/rewrite/create/delete for voice scope change
2. **Review:** Wait for all 3 loose-end reports → approve before they code
3. **Then SONNET:** Builds theme actions + voice management actions (others depend on these)
4. **Parallel — APUS:** Rewrites voice pipeline for merchants + confirms storefront chat API format
5. **Relay:** When APUS confirms chat API format → pass to CODEX for AIShoppingAssistant
6. **Relay:** When SONNET delivers theme actions → pass to CODEX for theme editor
7. **Then CODEX:** Builds remaining storefront components + dashboard voice page + theme editor
8. **Final relay:** When APUS delivers video generation interface → pass to CODEX for marketing page