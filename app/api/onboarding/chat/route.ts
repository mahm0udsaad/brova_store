import { NextRequest, NextResponse } from "next/server"
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getGatewayModel } from "@/lib/ai/config"
import { generateStoreImage } from "@/lib/ai/image-generation"
import { generateBannerContent } from "@/lib/ai/banner-generation"
import type { ComponentType } from "@/types/theme"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// =============================================================================
// Onboarding Chat API
//
// AI-powered page builder + onboarding chat. The AI selects from available
// storefront components, configures them, creates banners with AI-generated
// images, and saves everything to Supabase. No code writing — only component
// selection and configuration.
// =============================================================================

const STORE_TYPES = [
  "clothing",
  "car_care",
  "beauty",
  "electronics",
  "food",
  "home_decor",
  "services",
  "general",
] as const

type StoreType = (typeof STORE_TYPES)[number]

const STORE_TYPE_TEMPLATE_MAP: Record<StoreType, string> = {
  clothing: "showcase",
  beauty: "boutique",
  electronics: "catalog",
  food: "classic",
  home_decor: "classic",
  car_care: "catalog",
  services: "boutique",
  general: "classic",
}

const STORE_TYPE_PALETTE: Record<
  StoreType,
  { primary: string; accent: string; background: string; secondary: string }
> = {
  clothing: { primary: "#1a1a2e", accent: "#e94560", background: "#F9FAFB", secondary: "#6B7280" },
  beauty: { primary: "#831843", accent: "#f472b6", background: "#FFF1F2", secondary: "#9D174D" },
  electronics: { primary: "#0F172A", accent: "#2563EB", background: "#F8FAFC", secondary: "#475569" },
  food: { primary: "#7C2D12", accent: "#EA580C", background: "#FFFBEB", secondary: "#92400E" },
  home_decor: { primary: "#44403C", accent: "#A16207", background: "#FAFAF9", secondary: "#78716C" },
  car_care: { primary: "#0C1222", accent: "#1E40AF", background: "#F0F4FF", secondary: "#334155" },
  services: { primary: "#1E293B", accent: "#0EA5E9", background: "#F0F9FF", secondary: "#475569" },
  general: { primary: "#111827", accent: "#10B981", background: "#F9FAFB", secondary: "#6B7280" },
}

const ALL_SECTION_TYPES: ComponentType[] = [
  "StoreHeader",
  "HeroBanner",
  "ProductGrid",
  "ProductCarousel",
  "ProductDetail",
  "CategoryBrowser",
  "Testimonials",
  "NewsletterSignup",
  "FeaturedCollections",
  "StoreInfo",
  "ShippingCalculator",
  "CartDrawer",
  "CheckoutFlow",
  "StoreFooter",
  "AIShoppingAssistant",
  "WhatsAppButton",
  "TrustBadges",
  "DeliveryInfo",
  "OccasionBanner",
]

function buildSystemPrompt(
  storeId: string,
  storeName: string,
  storeType: string,
  locale: string,
  hasComponents: boolean,
  productCount: number
) {
  const isArabic = locale === "ar"

  const componentDocs = `
## Available Storefront Components
These are the components you can add to a store page using add_page_section:

### Core Components (added by template)
- StoreHeader — Navigation bar with logo, search, cart icon
- HeroBanner — Full-width hero with title, subtitle, CTA button, background image
- ProductGrid — Grid of product cards (auto-fills from store products)
- ProductCarousel — Horizontal scrolling product showcase
- FeaturedCollections — Collection cards with images and descriptions
- Testimonials — Customer reviews/quotes
- NewsletterSignup — Email subscription form
- StoreInfo — About the store section
- StoreFooter — Footer with links and social media

### MENA-Specific Components (add these for Saudi merchants)
- WhatsAppButton — Floating WhatsApp contact button. Config: { phone: "+966XXXXXXXXX", message?: "مرحبا", position?: "bottom-right"|"bottom-left" }
- TrustBadges — Payment method badges (mada, visa, mastercard, apple_pay, tamara, tabby, cod, stc_pay). Config: { badges?: [{ type: "mada" }, { type: "visa" }, ...] }
- DeliveryInfo — Delivery zones table with cities, timing, costs. Config: { zones?: [...], free_shipping_threshold?: 200, same_day_available?: true, currency?: "SAR" }
- OccasionBanner — Seasonal/occasion promotion banner. Config: { occasion: "ramadan"|"eid_fitr"|"eid_adha"|"national_day"|"white_friday"|"back_to_school"|"custom", title?, title_ar?, cta_text?, cta_link? }

### When to Add MENA Components
- ALWAYS add WhatsAppButton for Saudi stores (ask for their WhatsApp number)
- ALWAYS add TrustBadges with mada + common payment methods
- Add DeliveryInfo for physical product stores (clothing, electronics, food, home_decor)
- Add OccasionBanner if there's an upcoming Saudi occasion (Ramadan, Eid, National Day Sept 23, White Friday Nov)
`

  if (isArabic) {
    return `أنت مساعد بناء المتجر في منصة بروفا. أسلوبك ودود وذكي وعملي — مثل صديق خبير يساعدك تفتح متجرك الاحترافي.

# التدفق المطلوب (اتبعه بالترتيب)

## الخطوة 1 — الشعار واسم المتجر:
- إذا رفع التاجر شعار (لوقو): استخدم set_store_logo لحفظ رابط الصورة، ثم حلل الشعار بالرؤية الذكية
- إذا كان الشعار يحتوي على نص واضح (اسم المتجر): استخدمه كاسم المتجر واسأل التاجر للتأكيد: "شكلي شفت اسم متجرك [الاسم] في الشعار، صح؟"
- إذا الشعار بدون نص واضح أو لم يرفع شعار: اسأل: "ما اسم متجرك؟"
- بعد حفظ الاسم بالأداة، أكّد بجملة قصيرة ثم اسأل: "وش تبيع في متجرك؟"
- **مهم**: رابط الشعار موجود بعد "روابط الصور:" في رسالة التاجر — استخدمه في set_store_logo

## الخطوة 2 — نوع المتجر:
- حدد النوع من كلام التاجر أو من صور المنتجات
- إذا رفع صور: حلل الصور بعناية وحدد نوع المنتجات من محتوى الصورة الفعلي
- الأنواع المتاحة: clothing (ملابس/أزياء) | beauty (تجميل/عناية) | electronics (إلكترونيات) | food (أطعمة/مشروبات) | home_decor (ديكور/أثاث) | car_care (عناية سيارات) | services (خدمات) | general (عام)
- بعد حفظ النوع، استخدم setup_page_layout لتطبيق القالب المناسب تلقائياً:
  - clothing → "showcase" | beauty → "boutique" | electronics → "catalog" | car_care → "catalog"
  - food → "classic" | home_decor → "classic" | services → "boutique" | general → "classic"
- ثم أخبر التاجر: "جهزت قالب متجرك! نبدأ نضيف منتجاتك"
- **إذا طلب التاجر تغيير التصميم/القالب**: استخدم setup_page_layout مع القالب المطلوب
  - القوالب المتاحة: classic (شبكة تقليدية متوازنة) | showcase (عرض دوار + أقسام + شبكة 3 أعمدة) | catalog (أقسام أولاً، شبكة كثيفة، توصيل) | boutique (بسيط وفاخر، عرض دوار فقط بدون شبكة)

## الخطوة 3 — المنتجات:
- اسأل عن اسم المنتج وسعره (كلاهما مطلوب قبل الحفظ)
- إذا أعطاك الاسم فقط، اسأل عن السعر
- **مهم جداً**: إذا رفع التاجر صور، ستجد روابط الصور في الرسالة بعد "روابط الصور:". استخدم هذه الروابط في حقل image_url عند إضافة المنتج بأداة add_product
- بعد كل منتج: "تم! عندك منتج ثاني ولا نكمل؟"
- إذا قال "لا" أو "كذا بس"، انتقل للخطوة التالية

## الخطوة 4 — أقسام MENA:
- أضف WhatsAppButton — اسأل: "وش رقم الواتساب حق متجرك؟"
- أضف TrustBadges مع (mada, visa, apple_pay, tamara) تلقائياً
- إذا المتجر يبيع منتجات مادية: أضف DeliveryInfo
- إذا في مناسبة قريبة (رمضان، عيد، اليوم الوطني): اقترح OccasionBanner

## الخطوة 5 — المظهر والألوان:
- اقترح ألوان تناسب نوع المتجر
- استخدم update_store_theme لحفظ الألوان
- اقترح إنشاء بانر رئيسي: "تبي أصمم لك بانر رئيسي للمتجر؟"

## الخطوة 6 — البانرات (اختياري):
- إذا وافق، استخدم create_store_banner مع image_prompt دائماً لإنشاء صورة بالذكاء الاصطناعي (مثلاً: "elegant clothing store banner with modern fashion items")
- يمكنك اقتراح بانر مناسبة (رمضان، عيد، إلخ) إذا مناسب

## الخطوة 7 — الإكمال:
- عندما يقول "خلاص"، لخّص ما تم وأكمل بالأداة

# قواعد مهمة
- سؤال واحد فقط في كل رد
- جمل قصيرة ومباشرة
- بعد كل استخدام للأدوات يجب أن ترسل رد نصي: تأكيد قصير + السؤال التالي
- لا ترسل رد فارغ أبداً بعد استخدام أداة
- العملة: ر.س (ريال سعودي)
- أجب بالعربية دائماً
- إذا رفع التاجر صوراً، حلل محتوى الصور بعناية — لا تخمن
- عند إضافة منتج بصورة، استخدم رابط الصورة من "روابط الصور:" في حقل image_url — هذا ضروري لعرض الصورة في المعاينة

${componentDocs}

# معلومات المتجر الحالية
- معرف المتجر: ${storeId}
- اسم المتجر: ${storeName || "غير محدد بعد"}
- نوع المتجر: ${storeType || "غير محدد بعد"}
- القالب مطبق: ${hasComponents ? "نعم" : "لا"}
- عدد المنتجات: ${productCount}`
  }

  return `You are a store builder assistant for the Brova platform. You're friendly, smart, and practical — like an expert friend helping set up a professional online store.

# Required Flow (follow in order)

## Step 1 — Logo & Store Name:
- If the user uploads a logo image: use set_store_logo to save the image URL, then analyze the logo using vision
- If the logo contains readable text (store name): use it as the store name and confirm with the user: "I see the name [name] in your logo — is that right?"
- If the logo has no readable text or no logo uploaded: ask: "What's your store name?"
- After saving the name, confirm briefly then ask: "What kind of products do you sell?"
- **IMPORTANT**: The logo URL is in the message text after "Image URLs:" — use it in set_store_logo

## Step 2 — Store Type:
- Determine type from the merchant's messages or uploaded product images
- If images are uploaded: carefully analyze the actual image content — do NOT guess
- Available types: clothing | beauty | electronics | food | home_decor | car_care | services | general
- After saving type, use setup_page_layout to apply the matching template automatically:
  - clothing → "showcase" | beauty → "boutique" | electronics → "catalog" | car_care → "catalog"
  - food → "classic" | home_decor → "classic" | services → "boutique" | general → "classic"
- Tell merchant: "I've set up your store template! Let's add your products."
- **If the merchant asks to change the layout/template**: use setup_page_layout with the requested template
  - Available templates: classic (balanced grid layout) | showcase (carousel + categories + 3-col grid) | catalog (categories-first, dense grid, delivery info) | boutique (minimal, carousel-only, no grid)

## Step 3 — Products:
- Both name AND price required before saving
- **IMPORTANT**: When the user uploads images, their URLs appear in the message after "Image URLs:". Use these URLs in the image_url field when calling add_product
- After each product: "Done! Want to add another, or move on?"
- When they say "no" or "that's all", move to the next step

## Step 4 — MENA Sections:
- Add WhatsAppButton — ask: "What's your store's WhatsApp number?"
- Add TrustBadges with (mada, visa, apple_pay, tamara) automatically
- Physical product stores: add DeliveryInfo
- If upcoming Saudi occasion (Ramadan, Eid, National Day Sept 23, White Friday Nov): suggest OccasionBanner

## Step 5 — Appearance & Colors:
- Suggest colors matching store type
- Use update_store_theme to save colors
- Suggest creating a hero banner: "Want me to design a hero banner for your store?"

## Step 6 — Banners (optional):
- If they agree, use create_store_banner and ALWAYS include image_prompt to generate an AI image (e.g., "elegant clothing store banner with modern fashion items")
- Suggest occasion banners if relevant

## Step 7 — Complete:
- When merchant says "done", summarize and complete using the tool

# Important Rules
- ONE question per response — never ask two questions
- Short, direct sentences — no hype, no apologies, no filler
- After EVERY tool call you MUST send a text response with: brief confirmation + the next question
- Never send an empty response after a tool call
- Currency: SAR (Saudi Riyal)
- Reply in English
- When images are uploaded, analyze the actual image content carefully — do NOT guess
- When adding a product with an uploaded image, use the URL from "Image URLs:" in the image_url field — this is essential for displaying the image in the preview

${componentDocs}

# Current Store Info
- Store ID: ${storeId}
- Store name: ${storeName || "Not set yet"}
- Store type: ${storeType || "Not set yet"}
- Template applied: ${hasComponents ? "Yes" : "No"}
- Product count: ${productCount}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { messages, storeId, locale = "ar" } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      )
    }

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }

    // Verify store ownership
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, name, store_type, status, organization_id, organizations!inner(owner_id)"
      )
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const orgData = Array.isArray(store.organizations)
      ? store.organizations[0]
      : store.organizations
    if ((orgData as any)?.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get current component count and product count for context
    const [componentsResult, productsResult] = await Promise.all([
      supabase
        .from("store_components")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "active"),
      supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId),
    ])

    const hasComponents = (componentsResult.count ?? 0) > 0
    const productCount = productsResult.count ?? 0

    const modelMessages = await convertToModelMessages(messages)

    const systemPrompt = buildSystemPrompt(
      storeId,
      store.name || "",
      store.store_type || "",
      locale,
      hasComponents,
      productCount
    )

    const result = streamText({
      model: getGatewayModel("claude-sonnet-4-5"),
      system: systemPrompt,
      messages: modelMessages,
      stopWhen: stepCountIs(6),
      tools: {
        // =====================================================================
        // TOOL 1: Set Store Name
        // =====================================================================
        set_store_name: tool({
          description:
            "Set the store name. Call when the user provides or confirms a store name.",
          inputSchema: z.object({
            name: z.string().describe("The store name"),
          }),
          execute: async ({ name }) => {
            const { error } = await supabase
              .from("stores")
              .update({
                name,
                updated_at: new Date().toISOString(),
              })
              .eq("id", storeId)

            if (error) return { success: false, error: error.message }
            return { success: true, name, type: "store_name" }
          },
        }),

        // =====================================================================
        // TOOL 1b: Set Store Logo
        // =====================================================================
        set_store_logo: tool({
          description:
            "Save the store logo URL. Call when the user uploads a logo image.",
          inputSchema: z.object({
            logo_url: z.string().describe("The uploaded logo image URL"),
          }),
          execute: async ({ logo_url }) => {
            // Get current settings
            const { data: current } = await supabase
              .from("store_settings")
              .select("appearance")
              .eq("store_id", storeId)
              .single()

            const currentAppearance =
              (current?.appearance as Record<string, any>) || {}

            const appearance = {
              ...currentAppearance,
              logo_url,
            }

            const { error } = await supabase.from("store_settings").upsert(
              {
                merchant_id: user!.id,
                store_id: storeId,
                appearance,
                updated_at: new Date().toISOString(),
              } as any,
              { onConflict: "merchant_id" }
            )

            if (error) return { success: false, error: error.message }
            return { success: true, logo_url, type: "store_logo" }
          },
        }),

        // =====================================================================
        // TOOL 2: Set Store Type (expanded to 8 types)
        // =====================================================================
        set_store_type: tool({
          description:
            "Set the store type/category. After this, ALWAYS call setup_page_layout next.",
          inputSchema: z.object({
            store_type: z.enum(STORE_TYPES),
          }),
          execute: async ({ store_type }) => {
            const templateId = STORE_TYPE_TEMPLATE_MAP[store_type]
            const palette = STORE_TYPE_PALETTE[store_type]

            const { error } = await supabase
              .from("stores")
              .update({
                store_type,
                updated_at: new Date().toISOString(),
              })
              .eq("id", storeId)

            if (error) return { success: false, error: error.message }
            return {
              success: true,
              store_type,
              recommended_template: templateId,
              recommended_palette: palette,
              type: "store_type",
            }
          },
        }),

        // =====================================================================
        // TOOL 3: Setup Page Layout (apply template)
        // =====================================================================
        setup_page_layout: tool({
          description:
            "Apply a page template to the store. Also use this to switch templates when the user asks for a different layout. Templates: classic (balanced grid), showcase (carousel + categories + grid), catalog (categories-first, dense, delivery info), boutique (minimal, carousel-only, no grid).",
          inputSchema: z.object({
            template: z
              .enum(["classic", "showcase", "catalog", "boutique"])
              .describe("classic=balanced grid, showcase=editorial carousel+categories+grid, catalog=category-first dense, boutique=minimal carousel-only"),
          }),
          execute: async ({ template }) => {
            const { getTemplateById } = await import("@/lib/theme/templates")
            const tmpl = getTemplateById(template)
            if (!tmpl) return { success: false, error: "Template not found" }

            // Delete existing components
            await supabase
              .from("store_components")
              .delete()
              .eq("store_id", storeId)

            // Insert template components
            const rows = tmpl.nodes.map((node, i) => ({
              store_id: storeId,
              component_type: node.type,
              config: node.config,
              position: node.order ?? i,
              status: node.visible !== false ? "active" : "inactive",
            }))

            const { error } = await supabase
              .from("store_components")
              .insert(rows as any)

            if (error) return { success: false, error: error.message }

            // Only apply default palette on initial setup (no existing colors).
            // If colors already exist, the user/AI set them — don't overwrite.
            const { data: existingSettings } = await supabase
              .from("store_settings")
              .select("appearance, theme_config")
              .eq("store_id", storeId)
              .single()

            const existingAppearance =
              (existingSettings?.appearance as Record<string, any>) || {}
            const existingThemeConfig =
              (existingSettings?.theme_config as Record<string, any>) || {}
            const hasExistingColors = !!(existingAppearance.primary_color || existingThemeConfig?.colors?.primary)

            if (!hasExistingColors) {
              // Re-fetch store type (may have been updated by set_store_type in the same run)
              const { data: freshStore } = await supabase
                .from("stores")
                .select("store_type")
                .eq("id", storeId)
                .single()
              const storeType = ((freshStore?.store_type || store.store_type || "general") as StoreType)
              const palette = STORE_TYPE_PALETTE[storeType] || STORE_TYPE_PALETTE.general

              await supabase.from("store_settings").upsert(
                {
                  merchant_id: user!.id,
                  store_id: storeId,
                  appearance: {
                    ...existingAppearance,
                    primary_color: palette.primary,
                    accent_color: palette.accent,
                    font_family: existingAppearance.font_family || "Cairo",
                  },
                  theme_config: {
                    ...existingThemeConfig,
                    colors: {
                      ...(existingThemeConfig.colors || {}),
                      primary: palette.primary,
                      secondary: palette.secondary,
                      accent: palette.accent,
                      background: palette.background,
                    },
                  },
                  updated_at: new Date().toISOString(),
                } as any,
                { onConflict: "merchant_id" }
              )
            }

            return {
              success: true,
              template,
              sections_count: rows.length,
              sections: rows.map((r) => r.component_type),
              type: "page_layout",
            }
          },
        }),

        // =====================================================================
        // TOOL 4: Add Page Section
        // =====================================================================
        add_page_section: tool({
          description:
            "Add a new component section to the store page. Use for WhatsAppButton, TrustBadges, DeliveryInfo, OccasionBanner, or any other component.",
          inputSchema: z.object({
            section_type: z
              .enum(ALL_SECTION_TYPES as [string, ...string[]])
              .describe("The component type to add"),
            config: z
              .record(z.unknown())
              .optional()
              .describe("Component configuration object"),
            position: z
              .number()
              .optional()
              .describe("Position/order (appended at end if omitted)"),
          }),
          execute: async ({ section_type, config, position }) => {
            // Get max position if not specified
            let pos = position
            if (pos === undefined) {
              const { data } = await supabase
                .from("store_components")
                .select("position")
                .eq("store_id", storeId)
                .order("position", { ascending: false })
                .limit(1)
                .single()
              pos = (data?.position ?? -1) + 1
            }

            const { data, error } = await supabase
              .from("store_components")
              .insert({
                store_id: storeId,
                component_type: section_type,
                config: config || {},
                position: pos,
                status: "active",
              } as any)
              .select("id, component_type, position")
              .single()

            if (error) return { success: false, error: error.message }
            return { success: true, section: data, type: "add_section" }
          },
        }),

        // =====================================================================
        // TOOL 5: Remove Page Section
        // =====================================================================
        remove_page_section: tool({
          description:
            "Remove a component section from the store page by its ID.",
          inputSchema: z.object({
            section_id: z.string().describe("The component ID to remove"),
          }),
          execute: async ({ section_id }) => {
            const { error } = await supabase
              .from("store_components")
              .delete()
              .eq("id", section_id)
              .eq("store_id", storeId)

            if (error) return { success: false, error: error.message }
            return { success: true, removed_id: section_id, type: "remove_section" }
          },
        }),

        // =====================================================================
        // TOOL 6: Update Page Section
        // =====================================================================
        update_page_section: tool({
          description:
            "Update the configuration of an existing page section.",
          inputSchema: z.object({
            section_id: z.string().describe("The component ID to update"),
            config: z
              .record(z.unknown())
              .describe("New configuration to merge into existing config"),
          }),
          execute: async ({ section_id, config }) => {
            // Get current config
            const { data: current } = await supabase
              .from("store_components")
              .select("config")
              .eq("id", section_id)
              .eq("store_id", storeId)
              .single()

            const merged = {
              ...((current?.config as Record<string, unknown>) || {}),
              ...config,
            }

            const { error } = await supabase
              .from("store_components")
              .update({
                config: merged,
                updated_at: new Date().toISOString(),
              })
              .eq("id", section_id)
              .eq("store_id", storeId)

            if (error) return { success: false, error: error.message }
            return { success: true, section_id, config: merged, type: "update_section" }
          },
        }),

        // =====================================================================
        // TOOL 7: Create Store Banner
        // =====================================================================
        create_store_banner: tool({
          description:
            "Create a promotional banner for the store. Can generate AI images and bilingual content.",
          inputSchema: z.object({
            position: z
              .enum(["hero", "top", "middle", "bottom"])
              .describe("Where to place the banner"),
            title: z.string().optional().describe("Banner title (English)"),
            title_ar: z.string().optional().describe("Banner title (Arabic)"),
            subtitle: z.string().optional().describe("Banner subtitle (English)"),
            subtitle_ar: z.string().optional().describe("Banner subtitle (Arabic)"),
            cta_text: z.string().optional().describe("Button text (English)"),
            cta_text_ar: z.string().optional().describe("Button text (Arabic)"),
            occasion: z
              .string()
              .optional()
              .describe("Occasion for auto-generating content (ramadan, eid_fitr, eid_adha, national_day, white_friday)"),
            image_prompt: z
              .string()
              .optional()
              .describe("Prompt to generate a banner image using AI. If provided, an image will be generated."),
          }),
          execute: async ({
            position,
            title,
            title_ar,
            subtitle,
            subtitle_ar,
            cta_text,
            cta_text_ar,
            occasion,
            image_prompt,
          }) => {
            let imageUrl: string | null = null
            let bannerTitle = title
            let bannerTitleAr = title_ar
            let bannerSubtitle = subtitle
            let bannerSubtitleAr = subtitle_ar
            let bannerCta = cta_text
            let bannerCtaAr = cta_text_ar

            // Generate bilingual content if occasion provided and no title
            if (occasion && !title) {
              const content = await generateBannerContent({
                store_name: store.name || "Store",
                store_type: (store.store_type || "general") as any,
                occasion,
              })
              if (content.success && content.data) {
                bannerTitle = content.data.title
                bannerTitleAr = content.data.title_ar
                bannerSubtitle = content.data.subtitle
                bannerSubtitleAr = content.data.subtitle_ar
                bannerCta = content.data.cta_text
                bannerCtaAr = content.data.cta_text_ar
              }
            }

            // Generate image if prompt provided
            if (image_prompt) {
              const imageResult = await generateStoreImage(image_prompt, {
                storeId,
                style: position === "hero" ? "hero" : "banner",
                aspect_ratio: "16:9",
              })
              if ("url" in imageResult) {
                imageUrl = imageResult.url
              }
            }

            // Get next sort order
            const { data: existingRows } = await supabase
              .from("store_banners")
              .select("sort_order")
              .eq("store_id", storeId)
              .order("sort_order", { ascending: false })
              .limit(1)

            const sortOrder = (existingRows?.[0]?.sort_order ?? -1) + 1

            const { data, error } = await supabase
              .from("store_banners")
              .insert({
                store_id: storeId,
                image_url: imageUrl || "",
                title: bannerTitle || null,
                title_ar: bannerTitleAr || null,
                subtitle: bannerSubtitle || null,
                subtitle_ar: bannerSubtitleAr || null,
                cta_text: bannerCta || null,
                cta_text_ar: bannerCtaAr || null,
                position,
                sort_order: sortOrder,
                is_active: true,
              } as any)
              .select("id, title, title_ar, position, image_url")
              .single()

            if (error) return { success: false, error: error.message }
            return {
              success: true,
              banner: data,
              image_generated: !!imageUrl,
              type: "banner",
            }
          },
        }),

        // =====================================================================
        // TOOL 8: Update Store Theme
        // =====================================================================
        update_store_theme: tool({
          description:
            "Update the store's colors, fonts, and theme configuration.",
          inputSchema: z.object({
            primary_color: z
              .string()
              .optional()
              .describe("Primary brand color hex (e.g. #1a1a2e)"),
            secondary_color: z
              .string()
              .optional()
              .describe("Secondary color hex"),
            accent_color: z
              .string()
              .optional()
              .describe("Accent color hex (e.g. #e94560)"),
            background_color: z
              .string()
              .optional()
              .describe("Background color hex"),
            font_family: z
              .string()
              .optional()
              .describe("Font family name (e.g. Cairo, Inter, Tajawal)"),
          }),
          execute: async ({
            primary_color,
            secondary_color,
            accent_color,
            background_color,
            font_family,
          }) => {
            // Get current settings
            const { data: current } = await supabase
              .from("store_settings")
              .select("appearance, theme_config")
              .eq("store_id", storeId)
              .single()

            const currentAppearance =
              (current?.appearance as Record<string, any>) || {}
            const currentConfig =
              (current?.theme_config as Record<string, any>) || {}

            const appearance = {
              ...currentAppearance,
              ...(primary_color && { primary_color }),
              ...(accent_color && { accent_color }),
              ...(font_family && { font_family }),
            }

            const themeConfig = {
              ...currentConfig,
              colors: {
                ...(currentConfig.colors || {}),
                ...(primary_color && { primary: primary_color }),
                ...(secondary_color && { secondary: secondary_color }),
                ...(accent_color && { accent: accent_color }),
                ...(background_color && { background: background_color }),
              },
              ...(font_family && {
                typography: {
                  ...(currentConfig.typography || {}),
                  fontBody: font_family,
                  fontHeading: font_family,
                },
              }),
            }

            const { error } = await supabase.from("store_settings").upsert(
              {
                merchant_id: user!.id,
                store_id: storeId,
                appearance,
                theme_config: themeConfig,
                updated_at: new Date().toISOString(),
              } as any,
              { onConflict: "merchant_id" }
            )

            if (error) return { success: false, error: error.message }
            return {
              success: true,
              appearance,
              theme_config: themeConfig,
              type: "theme",
            }
          },
        }),

        // =====================================================================
        // TOOL 9: Generate Section Image
        // =====================================================================
        generate_section_image: tool({
          description:
            "Generate an image using AI for use in store sections (hero, banners, etc). Returns a URL.",
          inputSchema: z.object({
            prompt: z
              .string()
              .describe("Description of the image to generate"),
            style: z
              .enum(["banner", "hero", "lifestyle", "product_photo", "minimal"])
              .describe("Visual style for the image"),
          }),
          execute: async ({ prompt, style }) => {
            const result = await generateStoreImage(prompt, {
              storeId,
              style,
              aspect_ratio: style === "hero" || style === "banner" ? "16:9" : "1:1",
            })

            if ("error" in result) {
              return { success: false, error: result.error }
            }
            return { success: true, image_url: result.url, type: "image" }
          },
        }),

        // =====================================================================
        // TOOL 10: Add Product
        // =====================================================================
        add_product: tool({
          description:
            "Add a product to the store. Only call when both name AND price are provided.",
          inputSchema: z.object({
            name: z.string().describe("Product name"),
            name_ar: z.string().optional().describe("Product name in Arabic"),
            description: z.string().optional().describe("Product description"),
            description_ar: z
              .string()
              .optional()
              .describe("Product description in Arabic"),
            price: z.number().describe("Product price in SAR"),
            category: z.string().optional().describe("Product category"),
            image_url: z.string().optional().describe("Product image URL"),
          }),
          execute: async ({
            name,
            name_ar,
            description,
            description_ar,
            price,
            category,
            image_url,
          }) => {
            const slug = `${name
              .toLowerCase()
              .replace(/[^a-z0-9\u0621-\u064A]+/g, "-")
              .replace(/^-|-$/g, "")}-${Date.now()}`

            const { data, error } = await supabase
              .from("store_products")
              .insert({
                store_id: storeId,
                name,
                name_ar: name_ar || null,
                slug,
                description: description || null,
                description_ar: description_ar || null,
                price,
                currency: "SAR",
                category: category || null,
                image_url: image_url || null,
                images: image_url ? [image_url] : [],
                status: "draft",
                ai_generated: true,
                ai_confidence: "medium",
                inventory: 0,
              } as any)
              .select("id, name, name_ar, price, image_url")
              .single()

            if (error) return { success: false, error: error.message }
            return { success: true, product: data, type: "product" }
          },
        }),

        // =====================================================================
        // TOOL 11: Complete Setup
        // =====================================================================
        // =====================================================================
        // TOOL: Set Store Skin
        // =====================================================================
        set_store_skin: tool({
          description:
            "Set the visual design skin for the store. Available skins: 'default' (basic), 'yns' (modern minimal with large images and subtle shadows — recommended for most stores), 'paper' (editorial structured with borders, professional look). Default to 'yns' for new stores.",
          inputSchema: z.object({
            skin_id: z.enum(["default", "yns", "paper"]).describe("The skin to apply"),
          }),
          execute: async ({ skin_id }) => {
            const { error } = await supabase
              .from("stores")
              .update({ skin_id, updated_at: new Date().toISOString() })
              .eq("id", storeId)

            if (error) return { success: false, error: error.message }
            return { success: true, skin_id, type: "skin" }
          },
        }),

        complete_setup: tool({
          description:
            "Mark the store as complete and publish it. ONLY call when the merchant explicitly says they are done.",
          inputSchema: z.object({
            summary: z.string().describe("Brief summary of what was set up"),
          }),
          execute: async ({ summary }) => {
            // Activate all draft products
            await supabase
              .from("store_products")
              .update({ status: "active" })
              .eq("store_id", storeId)
              .eq("status", "draft")

            // Default skin to 'yns' if not explicitly set
            const { data: currentStore } = await supabase
              .from("stores")
              .select("skin_id")
              .eq("id", storeId)
              .single()

            const skinId = currentStore?.skin_id || "yns"

            const { error } = await supabase
              .from("stores")
              .update({
                onboarding_completed: "completed",
                status: "active",
                skin_id: skinId,
                updated_at: new Date().toISOString(),
                published_at: new Date().toISOString(),
              })
              .eq("id", storeId)

            if (error) return { success: false, error: error.message }
            return { success: true, summary, type: "complete" }
          },
        }),
      },
      maxRetries: 2,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Onboarding chat API error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
