/**
 * V2 Agent Tool Definitions
 *
 * All tools are defined with Zod schemas and execute functions.
 * Tools wrap existing business logic and never write to production tables directly.
 */
import { tool } from "ai"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { groupImagesByVisualSimilarity } from "@/lib/bulk-processing/image-grouper"
import { suggestPricing } from "@/lib/bulk-processing/product-creator"
import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"
import {
  ImageGroupSchema,
  ProductDraftSchema,
  type AgentContext,
  type ImageGroup,
} from "../schemas"

// ─── Vision Agent Tools ────────────────────────────────────────

export const analyzeImages = tool({
  description:
    "Analyze uploaded product images and group them by visual similarity. Groups images that show the same product (different angles, colors, etc.).",
  inputSchema: z.object({
    image_urls: z.array(z.string()).describe("URLs of images to analyze"),
    batch_id: z.string().optional().describe("Batch ID for tracking"),
  }),
  execute: async ({ image_urls, batch_id }) => {
    const groups = await groupImagesByVisualSimilarity(image_urls)
    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        image_urls: g.images,
        primary_image_url: g.mainImage,
        category_hint: g.category,
      })),
      total_images: image_urls.length,
      total_groups: groups.length,
      batch_id,
    }
  },
})

// ─── Product Intelligence Tools ────────────────────────────────

export const generateProductDetails = tool({
  description:
    "Generate bilingual (AR/EN) product details including name, description, category, and tags for a product image group. Saves result as a draft.",
  inputSchema: z.object({
    group: z.object({
      id: z.string(),
      name: z.string(),
      image_urls: z.array(z.string()),
      primary_image_url: z.string(),
      category_hint: z.string().optional(),
    }),
    locale: z.enum(["en", "ar"]).describe("Primary locale"),
    store_type: z.enum(["clothing", "car_care"]).describe("Store type"),
    store_id: z.string().describe("Store ID for draft storage"),
    merchant_id: z.string().describe("Merchant ID"),
    batch_id: z.string().optional().describe("Batch ID"),
    group_index: z.number().optional().describe("Position in batch"),
  }),
  execute: async ({
    group,
    locale,
    store_type,
    store_id,
    merchant_id,
    batch_id,
    group_index,
  }) => {
    const storeTypeLabel =
      store_type === "clothing" ? "fashion/streetwear" : "car care products"

    const prompt = `You are a product copywriter for a ${storeTypeLabel} store.

Generate details for this product:
- Current name: ${group.name}
- Category hint: ${group.category_hint || "unknown"}
- Number of images: ${group.image_urls.length}

Return JSON:
{
  "name": "English product name (2-4 words)",
  "name_ar": "Arabic product name",
  "description": "English description (2-3 sentences, compelling)",
  "description_ar": "Arabic description (2-3 sentences)",
  "category": "English category",
  "category_ar": "Arabic category",
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_price": null,
  "ai_confidence": "high" | "medium" | "low"
}

Rules:
- Names must be marketable and appropriate for ${storeTypeLabel}
- Arabic text must be natural, not machine-translated
- Tags should be relevant for search
- Set ai_confidence based on how clear the product is from the name/category hint

Return ONLY valid JSON.`

    const result = await generateText({
      model: models.pro,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 500,
    })

    let details: any
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      details = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      details = null
    }

    if (!details) {
      details = {
        name: group.name,
        name_ar: group.name,
        description: `Premium ${group.category_hint || "product"} from our collection.`,
        description_ar: `منتج مميز من مجموعتنا.`,
        category: group.category_hint || "Uncategorized",
        category_ar: "غير مصنف",
        tags: [],
        suggested_price: null,
        ai_confidence: "low",
      }
    }

    // Try to get price suggestion
    if (!details.suggested_price && details.category) {
      const pricing = await suggestPricing(details.category, merchant_id)
      if (pricing) {
        details.suggested_price = pricing.suggested
      }
    }

    // Save draft to product_drafts table
    const admin = createAdminClient()
    const { data: draft, error } = await admin
      .from("product_drafts")
      .insert({
        batch_id: batch_id || null,
        store_id,
        merchant_id,
        group_index: group_index ?? null,
        name: details.name,
        name_ar: details.name_ar,
        description: details.description,
        description_ar: details.description_ar,
        category: details.category,
        category_ar: details.category_ar,
        tags: details.tags || [],
        suggested_price: details.suggested_price,
        image_urls: group.image_urls,
        primary_image_url: group.primary_image_url,
        ai_confidence: details.ai_confidence || "medium",
        status: "draft",
        metadata: { source_group_id: group.id },
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      draft_id: draft.id,
      ...details,
      image_urls: group.image_urls,
      primary_image_url: group.primary_image_url,
    }
  },
})

export const suggestCategories = tool({
  description:
    "Suggest product categories based on product name and description.",
  inputSchema: z.object({
    product_name: z.string(),
    store_type: z.enum(["clothing", "car_care"]),
  }),
  execute: async ({ product_name, store_type }) => {
    const categories =
      store_type === "clothing"
        ? [
            "T-Shirts",
            "Hoodies",
            "Pants",
            "Jackets",
            "Accessories",
            "Shoes",
            "Shorts",
            "Dresses",
          ]
        : [
            "Interior Care",
            "Exterior Care",
            "Detailing",
            "Accessories",
            "Tools",
            "Fragrances",
          ]

    const prompt = `Given a ${store_type} product named "${product_name}", which of these categories fits best?
Categories: ${categories.join(", ")}

Return JSON: { "primary": "Category", "secondary": "Category or null" }
Return ONLY valid JSON.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 100,
    })

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { primary: categories[0] }
    } catch {
      return { primary: categories[0] }
    }
  },
})

// ─── Editing Agent Tools ───────────────────────────────────────

export const rewriteText = tool({
  description:
    "Rewrite product text (name or description) with a specific instruction like 'make it shorter', 'more formal', etc.",
  inputSchema: z.object({
    text: z.string().describe("Original text to rewrite"),
    instruction: z
      .string()
      .describe("How to rewrite (e.g. 'shorter', 'more formal')"),
    field: z
      .enum(["name", "description"])
      .describe("Which field is being edited"),
    locale: z.enum(["en", "ar"]).describe("Language of the text"),
  }),
  execute: async ({ text, instruction, field, locale }) => {
    const langLabel = locale === "ar" ? "Arabic" : "English"
    const prompt = `Rewrite this ${langLabel} product ${field}: "${text}"

Instruction: ${instruction}

Rules:
- Keep it in ${langLabel}
- ${field === "name" ? "Keep it 2-4 words" : "Keep it 2-3 sentences"}
- Return ONLY the rewritten text, nothing else.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: field === "name" ? 50 : 200,
    })

    return { original: text, rewritten: result.text.trim() }
  },
})

// ─── Manager Orchestration Tools ───────────────────────────────

export const askUser = tool({
  description:
    "Ask the user a question with predefined options. Use this for confirmations, preferences, and decisions. The response will be rendered as interactive buttons in the UI.",
  inputSchema: z.object({
    question: z.string().describe("The question to ask"),
    options: z
      .array(
        z.object({
          label: z.string().describe("Button label"),
          value: z.string().describe("Value returned on selection"),
        })
      )
      .describe("Available choices"),
    allow_multiple: z
      .boolean()
      .optional()
      .describe("Allow selecting multiple options"),
  }),
  // No execute — this is a UI-only tool that pauses for user input
})

export const renderDraftCards = tool({
  description:
    "Render a grid of draft product cards for user review. Each card shows the product image slider, name, price, and action buttons.",
  inputSchema: z.object({
    draft_ids: z.array(z.string()).describe("IDs of drafts to display"),
  }),
  execute: async ({ draft_ids }) => {
    const admin = createAdminClient()
    const { data: drafts, error } = await admin
      .from("product_drafts")
      .select("*")
      .in("id", draft_ids)
      .order("group_index", { ascending: true })

    if (error || !drafts) {
      return { success: false, error: error?.message || "No drafts found" }
    }

    return {
      success: true,
      drafts: drafts.map((d: any) => ({
        draft_id: d.id,
        name: d.name,
        name_ar: d.name_ar,
        description: d.description,
        description_ar: d.description_ar,
        image_urls: d.image_urls,
        primary_image_url: d.primary_image_url,
        suggested_price: d.suggested_price,
        category: d.category,
        category_ar: d.category_ar,
        tags: d.tags,
        ai_confidence: d.ai_confidence,
        status: d.status,
      })),
    }
  },
})

export const confirmAndPersist = tool({
  description:
    "Persist approved draft products to the store. This is the ONLY tool that writes to store_products. Requires explicit user confirmation first.",
  inputSchema: z.object({
    draft_ids: z.array(z.string()).describe("IDs of approved drafts"),
    store_id: z.string().describe("Target store ID"),
    merchant_id: z.string().describe("Merchant ID for ownership"),
  }),
  execute: async ({ draft_ids, store_id, merchant_id }) => {
    const admin = createAdminClient()

    // Fetch drafts
    const { data: drafts, error: fetchError } = await admin
      .from("product_drafts")
      .select("*")
      .in("id", draft_ids)
      .eq("merchant_id", merchant_id)
      .eq("store_id", store_id)

    if (fetchError || !drafts || drafts.length === 0) {
      return {
        success: false,
        error: fetchError?.message || "No valid drafts found",
      }
    }

    const created: string[] = []
    const failed: string[] = []

    for (const draft of drafts) {
      // Generate a URL-safe slug
      const slug = (draft.name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .concat(`-${Date.now().toString(36)}`)

      const { data: product, error: insertError } = await admin
        .from("store_products")
        .insert({
          store_id,
          name: draft.name ?? "Untitled",
          name_ar: draft.name_ar,
          description: draft.description,
          description_ar: draft.description_ar,
          category: draft.category,
          category_ar: draft.category_ar,
          tags: draft.tags || [],
          price: draft.suggested_price || 0,
          image_url: draft.primary_image_url,
          images: draft.image_urls || [],
          slug,
          status: "draft",
          ai_generated: true,
          ai_confidence: draft.ai_confidence,
          inventory: 0,
        } as any)
        .select("id")
        .single()

      if (insertError || !product) {
        failed.push(draft.id)
        continue
      }

      // Mark draft as persisted
      await admin
        .from("product_drafts")
        .update({ status: "persisted" })
        .eq("id", draft.id)

      created.push(product.id)
    }

    return {
      success: failed.length === 0,
      created_count: created.length,
      failed_count: failed.length,
      created_product_ids: created,
      failed_draft_ids: failed,
    }
  },
})

export const updateDraft = tool({
  description:
    "Update a specific field on a product draft. Used when the user edits a draft via the UI.",
  inputSchema: z.object({
    draft_id: z.string().describe("Draft ID to update"),
    field: z
      .enum([
        "name",
        "name_ar",
        "description",
        "description_ar",
        "category",
        "category_ar",
        "tags",
        "suggested_price",
        "primary_image_url",
      ])
      .describe("Field to update"),
    value: z.any().describe("New value"),
    merchant_id: z.string().describe("Merchant ID for ownership check"),
  }),
  execute: async ({ draft_id, field, value, merchant_id }) => {
    const admin = createAdminClient()
    const { error } = await admin
      .from("product_drafts")
      .update({ [field]: value })
      .eq("id", draft_id)
      .eq("merchant_id", merchant_id)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, draft_id, field, value }
  },
})

export const discardDrafts = tool({
  description: "Discard draft products that the user does not want to keep.",
  inputSchema: z.object({
    draft_ids: z.array(z.string()).describe("IDs of drafts to discard"),
    merchant_id: z.string().describe("Merchant ID for ownership check"),
  }),
  execute: async ({ draft_ids, merchant_id }) => {
    const admin = createAdminClient()
    const { error } = await admin
      .from("product_drafts")
      .update({ status: "discarded" })
      .in("id", draft_ids)
      .eq("merchant_id", merchant_id)

    return {
      success: !error,
      discarded_count: error ? 0 : draft_ids.length,
      error: error?.message,
    }
  },
})

// ─── Image Edit Agent Tools ────────────────────────────────────

export * from "./image-tools"
