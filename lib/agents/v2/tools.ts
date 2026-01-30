/**
 * AI Manager Tools (V2)
 *
 * These tools are used by the Manager Agent to:
 * - Ask users for decisions (Generative UI)
 * - Render draft product cards (Generative UI)
 * - Persist approved drafts to production
 * - Update/discard drafts
 * - Rewrite text
 */

import { tool, generateText, generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { models } from "@/lib/ai/gateway"

// ========================================
// Tool: askUser
// Purpose: Render MCQ buttons for user decision
// ========================================
export const askUser = tool({
  description:
    "Ask the user a question with multiple choice options. This will render as interactive buttons in the UI. Use this when you need the user to make a decision.",
  parameters: z.object({
    question: z
      .string()
      .describe(
        "The question to ask the user. Be concise and clear (1-2 sentences max)"
      ),
    options: z
      .array(
        z.object({
          label: z
            .string()
            .describe(
              "The text shown on the button (e.g., 'Yes', 'No', 'Skip')"
            ),
          value: z
            .string()
            .describe("The value returned when this option is selected"),
          description: z
            .string()
            .optional()
            .describe("Optional explanation of what this option means"),
        })
      )
      .min(2)
      .max(4)
      .describe("2-4 options for the user to choose from"),
  }),
  execute: async ({ question, options }) => {
    // This tool doesn't execute server-side logic
    // It returns structured data that the UI will render as buttons
    return {
      type: "ask_user" as const,
      question,
      options,
      ui_component: "MCQButtons",
    }
  },
})

// ========================================
// Tool: renderDraftCards
// Purpose: Show product preview cards with image sliders
// ========================================
export const renderDraftCards = tool({
  description:
    "Render product draft cards for user review. This will show product previews with images, names, descriptions, and edit buttons.",
  parameters: z.object({
    draft_ids: z
      .array(z.string())
      .describe("UUIDs of drafts to display from the product_drafts table"),
  }),
  execute: async ({ draft_ids }) => {
    const supabase = await createClient()

    // Fetch drafts from database
    const { data: drafts, error } = await supabase
      .from("product_drafts")
      .select("*")
      .in("id", draft_ids)
      .order("group_index", { ascending: true })

    if (error) {
      return {
        type: "error" as const,
        message: `Failed to load drafts: ${error.message}`,
      }
    }

    // Return structured data for Generative UI rendering
    return {
      type: "render_draft_cards" as const,
      drafts: drafts || [],
      ui_component: "DraftCardGrid",
    }
  },
})

// ========================================
// Tool: confirmAndPersist
// Purpose: Save approved drafts to store_products table
// ========================================
export const confirmAndPersist = tool({
  description:
    "Persist approved product drafts to the store's product catalog. This moves drafts from product_drafts to store_products. ONLY use this after the user explicitly confirms they want to save.",
  parameters: z.object({
    draft_ids: z
      .array(z.string())
      .describe("UUIDs of drafts to persist to store_products"),
  }),
  execute: async ({ draft_ids }) => {
    const supabase = await createClient()

    try {
      // 1. Fetch drafts
      const { data: drafts, error: fetchError } = await supabase
        .from("product_drafts")
        .select("*")
        .in("id", draft_ids)
        .eq("status", "draft") // Only persist drafts that haven't been persisted yet

      if (fetchError) throw new Error(`Failed to fetch drafts: ${fetchError.message}`)

      if (!drafts || drafts.length === 0) {
        return {
          success: false,
          error: "No drafts found or all drafts already persisted",
        }
      }

      // 2. Transform drafts to store_products format
      const products = drafts.map((draft) => ({
        store_id: draft.store_id,
        name: draft.name,
        name_ar: draft.name_ar,
        description: draft.description,
        description_ar: draft.description_ar,
        category: draft.category,
        category_ar: draft.category_ar,
        tags: draft.tags || [],
        price: draft.suggested_price,
        image_url: draft.primary_image_url,
        images: draft.image_urls || [],
        status: "draft" as const, // Still draft in store_products (merchant can publish later)
        ai_generated: true,
        ai_confidence: draft.ai_confidence || "medium",
        inventory: 0,
        slug: `${draft.name?.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      }))

      // 3. Insert into store_products
      const { data: insertedProducts, error: insertError } = await supabase
        .from("store_products")
        .insert(products)
        .select("id")

      if (insertError) throw new Error(`Failed to insert products: ${insertError.message}`)

      // 4. Update draft status to 'persisted'
      const { error: updateError } = await supabase
        .from("product_drafts")
        .update({ status: "persisted" })
        .in("id", draft_ids)

      if (updateError) {
        console.error("Failed to update draft status:", updateError)
        // Non-fatal error, products were created successfully
      }

      // 5. Log to ai_tasks (audit trail)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("ai_tasks").insert({
          merchant_id: user.id,
          agent: "manager",
          task_type: "confirm_and_persist",
          status: "completed",
          input: { draft_ids },
          output: { product_ids: insertedProducts?.map((p) => p.id) || [] },
          metadata: {
            draft_count: drafts.length,
            product_count: insertedProducts?.length || 0,
          },
        })
      }

      return {
        success: true,
        product_ids: insertedProducts?.map((p) => p.id) || [],
        count: insertedProducts?.length || 0,
        message: `Successfully added ${insertedProducts?.length || 0} products to your store`,
      }
    } catch (error: any) {
      console.error("confirmAndPersist error:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  },
})

// ========================================
// Tool: updateDraft
// Purpose: Modify a draft before persistence
// ========================================
export const updateDraft = tool({
  description:
    "Update specific fields of a product draft. Use this when the user wants to edit a draft's name, description, category, or other details.",
  parameters: z.object({
    draft_id: z.string().describe("UUID of the draft to update"),
    updates: z
      .object({
        name: z.string().optional(),
        name_ar: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        category: z.string().optional(),
        category_ar: z.string().optional(),
        tags: z.array(z.string()).optional(),
        suggested_price: z.number().optional(),
        primary_image_url: z.string().optional(),
      })
      .describe("Fields to update (only provide fields that should change)"),
  }),
  execute: async ({ draft_id, updates }) => {
    const supabase = await createClient()

    try {
      // Update draft
      const { data, error } = await supabase
        .from("product_drafts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft_id)
        .select()
        .single()

      if (error) throw new Error(`Failed to update draft: ${error.message}`)

      return {
        success: true,
        draft: data,
        updated_fields: Object.keys(updates),
      }
    } catch (error: any) {
      console.error("updateDraft error:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  },
})

// ========================================
// Tool: discardDrafts
// Purpose: Delete unapproved drafts
// ========================================
export const discardDrafts = tool({
  description:
    "Delete product drafts that the user doesn't want to keep. This permanently removes drafts from the database. ONLY use this after the user explicitly confirms they want to discard.",
  parameters: z.object({
    draft_ids: z
      .array(z.string())
      .describe("UUIDs of drafts to delete from product_drafts table"),
  }),
  execute: async ({ draft_ids }) => {
    const supabase = await createClient()

    try {
      // Delete drafts
      const { error } = await supabase
        .from("product_drafts")
        .update({ status: "discarded" }) // Soft delete by marking as discarded
        .in("id", draft_ids)

      if (error) throw new Error(`Failed to discard drafts: ${error.message}`)

      // Log to ai_tasks (audit trail)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("ai_tasks").insert({
          merchant_id: user.id,
          agent: "manager",
          task_type: "discard_drafts",
          status: "completed",
          input: { draft_ids },
          output: { discarded_count: draft_ids.length },
        })
      }

      return {
        success: true,
        discarded_count: draft_ids.length,
        message: `Discarded ${draft_ids.length} draft${draft_ids.length === 1 ? "" : "s"}`,
      }
    } catch (error: any) {
      console.error("discardDrafts error:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  },
})

// ========================================
// Tool: rewriteText
// Purpose: Rewrite product text (used by editing agent)
// ========================================
export const rewriteText = tool({
  description:
    "Rewrite a product name or description based on an instruction. Use this when you need to refine text for clarity, tone, or length.",
  parameters: z.object({
    text: z.string().describe("The original text to rewrite"),
    instruction: z
      .string()
      .describe(
        "How to rewrite the text (e.g., 'make it shorter', 'add technical details', 'make it more casual')"
      ),
    field: z
      .enum(["name", "description"])
      .describe("Whether this is a product name or description"),
    locale: z
      .enum(["en", "ar"])
      .describe("Language of the text (English or Arabic)"),
  }),
  execute: async ({ text, instruction, field, locale }) => {
    try {
      const prompt = `You are a product copywriter expert. Rewrite the following product ${field}:

Original ${field}: "${text}"
Language: ${locale === "ar" ? "Arabic" : "English"}
Instruction: ${instruction}

Rules:
${field === "name" ? "- Product names must be 2-4 words" : "- Descriptions must be 2-3 sentences"}
- Maintain the same language (${locale === "ar" ? "Arabic" : "English"})
- Keep it marketable and clear
- Follow the instruction exactly
${field === "name" ? "- Use title case" : "- Be descriptive but concise"}

Return ONLY the rewritten ${field}, nothing else.`

      const result = await generateText({
        model: models.flash,
        prompt,
        maxTokens: field === "name" ? 50 : 200,
      })

      const rewritten = result.text.trim()

      return {
        original: text,
        rewritten,
        field,
        locale,
        instruction,
        confidence: rewritten.length > 0 ? "high" : "low",
      }
    } catch (error: any) {
      console.error("rewriteText error:", error)
      return {
        original: text,
        rewritten: text, // Fallback to original on error
        field,
        locale,
        instruction,
        confidence: "low",
        error: error.message || "Unknown error occurred",
      }
    }
  },
})

// ========================================
// Tool: analyzeImages
// Purpose: Analyze and group product images (used by vision agent)
// ========================================
export const analyzeImages = tool({
  description:
    "Analyze product images and group them by visual similarity. This uses multimodal vision AI to detect which images show the same product.",
  parameters: z.object({
    image_urls: z
      .array(z.string())
      .min(1)
      .describe("Array of image URLs to analyze"),
    batch_id: z.string().optional().describe("Optional batch ID for tracking"),
  }),
  execute: async ({ image_urls, batch_id }) => {
    try {
      const prompt = `Analyze these ${image_urls.length} product images and group them intelligently.

For each unique product you identify, create a group with:
1. A unique group ID
2. A descriptive name (what product is it?)
3. All image URLs that belong to this product
4. The best image URL to use as the primary/featured image (well-lit, front-facing, clear)
5. A category hint (clothing, accessory, shoes, etc.)
6. Confidence level (high/medium/low)

Rules:
- Every image must belong to exactly ONE group
- If two images show the same product from different angles, they belong in the SAME group
- If two images show different products (even similar ones), they belong in DIFFERENT groups
- If unsure, create separate groups (conservative approach)
- Primary image should be the clearest, most professional-looking photo

Return a JSON array of groups.`

      const schema = z.object({
        groups: z.array(
          z.object({
            id: z.string().describe("Unique group identifier"),
            name: z.string().describe("Product name/description"),
            image_urls: z.array(z.string()).describe("All images in this group"),
            primary_image_url: z.string().describe("Best image to feature"),
            category_hint: z.string().describe("Product category"),
            confidence: z.enum(["high", "medium", "low"]),
          })
        ),
      })

      const result = await generateObject({
        model: models.vision,
        schema,
        prompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...image_urls.map((url) => ({
                type: "image" as const,
                image: url,
              })),
            ],
          },
        ],
      })

      const groups = result.object.groups

      // Calculate low confidence images
      const lowConfidenceImages = groups
        .filter((g) => g.confidence === "low")
        .flatMap((g) => g.image_urls)

      return {
        groups,
        total_images: image_urls.length,
        total_groups: groups.length,
        low_confidence_images: lowConfidenceImages,
        batch_id,
      }
    } catch (error: any) {
      console.error("analyzeImages error:", error)

      // Fallback: create one group per image (safe fallback)
      const fallbackGroups = image_urls.map((url, idx) => ({
        id: `group-${idx + 1}`,
        name: `Product ${idx + 1}`,
        image_urls: [url],
        primary_image_url: url,
        category_hint: "unknown",
        confidence: "low" as const,
      }))

      return {
        groups: fallbackGroups,
        total_images: image_urls.length,
        total_groups: fallbackGroups.length,
        low_confidence_images: image_urls,
        batch_id,
        error: error.message || "Vision API failed, grouped each image separately",
      }
    }
  },
})

// ========================================
// Tool: generateProductDetails
// Purpose: Generate bilingual product details (used by product intel agent)
// ========================================
export const generateProductDetails = tool({
  description:
    "Generate bilingual (English + Arabic) product details including name, description, category, tags, and price suggestion. Saves result as a draft in product_drafts table.",
  parameters: z.object({
    group_id: z.string().describe("The image group ID this product is for"),
    group_name: z.string().describe("Initial product name from vision analysis"),
    image_urls: z.array(z.string()).describe("All images for this product"),
    primary_image_url: z.string().describe("Primary featured image"),
    category_hint: z.string().optional().describe("Category suggestion from vision analysis"),
    store_type: z.enum(["clothing", "car_care"]).describe("Type of store"),
    store_id: z.string().describe("Store ID for this product"),
    merchant_id: z.string().describe("Merchant ID"),
    batch_id: z.string().optional().describe("Batch ID for tracking"),
    group_index: z.number().optional().describe("Index of this group in the batch"),
    locale: z.enum(["en", "ar"]).default("en").describe("User's preferred language"),
  }),
  execute: async ({
    group_id,
    group_name,
    image_urls,
    primary_image_url,
    category_hint,
    store_type,
    store_id,
    merchant_id,
    batch_id,
    group_index,
    locale,
  }) => {
    const supabase = await createClient()

    try {
      const prompt = `You are a product copywriter expert for a ${store_type === "clothing" ? "fashion/streetwear" : "car care"} e-commerce store.

Generate compelling, bilingual product details for this product:

Initial name: ${group_name}
Category hint: ${category_hint || "unknown"}
Number of images: ${image_urls.length}
Store type: ${store_type}

Generate:
1. Product name (English) - 2-4 words, marketable, ${store_type === "clothing" ? "fashion-forward" : "professional"}
2. Product name (Arabic) - natural translation, not machine-translated
3. Description (English) - 2-3 sentences, compelling, highlight key features
4. Description (Arabic) - natural, fluent Arabic
5. Category - choose from: ${store_type === "clothing" ? "t-shirt, hoodie, jacket, pants, shoes, accessory" : "cleaner, polish, wax, accessory, tool, interior, exterior"}
6. Category (Arabic) - translated category
7. Tags - 3-5 relevant search terms (English)
8. Suggested price (EGP) - realistic market price
9. Confidence - high/medium/low based on image clarity

Important:
- Arabic text must be fluent and natural
- Price should be realistic for ${store_type === "clothing" ? "streetwear" : "car care products"}
- Confidence "high" = clear product, "medium" = reasonable assumptions, "low" = guessing`

      const schema = z.object({
        name: z.string().describe("Product name in English"),
        name_ar: z.string().describe("Product name in Arabic"),
        description: z.string().describe("Product description in English"),
        description_ar: z.string().describe("Product description in Arabic"),
        category: z.string().describe("Product category in English"),
        category_ar: z.string().describe("Product category in Arabic"),
        tags: z.array(z.string()).describe("3-5 search tags"),
        suggested_price: z.number().describe("Suggested price in EGP"),
        ai_confidence: z.enum(["high", "medium", "low"]),
      })

      const result = await generateObject({
        model: models.pro,
        schema,
        prompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image" as const,
                image: primary_image_url,
              },
            ],
          },
        ],
      })

      const details = result.object

      // Save to product_drafts table
      const { data: draft, error: insertError } = await supabase
        .from("product_drafts")
        .insert({
          batch_id,
          store_id,
          merchant_id,
          group_index,
          name: details.name,
          name_ar: details.name_ar,
          description: details.description,
          description_ar: details.description_ar,
          category: details.category,
          category_ar: details.category_ar,
          tags: details.tags,
          suggested_price: details.suggested_price,
          image_urls,
          primary_image_url,
          ai_confidence: details.ai_confidence,
          status: "draft",
          metadata: {
            group_id,
            category_hint,
          },
        })
        .select()
        .single()

      if (insertError) throw new Error(`Failed to save draft: ${insertError.message}`)

      return {
        success: true,
        draft_id: draft.id,
        details,
        message: `Generated ${locale === "ar" ? "تم إنشاء" : "draft created"}: ${details.name}`,
      }
    } catch (error: any) {
      console.error("generateProductDetails error:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
        group_id,
      }
    }
  },
})

// ========================================
// Tool: suggestCategories
// Purpose: Suggest product categories based on store type
// ========================================
export const suggestCategories = tool({
  description:
    "Suggest appropriate product categories based on store type and product description. Use this when the category is unclear.",
  parameters: z.object({
    product_description: z.string().describe("Product name or description"),
    store_type: z.enum(["clothing", "car_care"]).describe("Type of store"),
  }),
  execute: async ({ product_description, store_type }) => {
    try {
      const prompt = `Suggest 3-5 appropriate categories for this product:

Product: ${product_description}
Store type: ${store_type === "clothing" ? "Fashion/Streetwear" : "Car Care"}

Available categories for ${store_type}:
${store_type === "clothing"
  ? "t-shirt, hoodie, jacket, pants, shorts, shoes, accessory, hat, bag, socks"
  : "cleaner, polish, wax, sealant, accessory, tool, interior, exterior, tire, glass"}

Return the top 3 most likely categories (most likely first).`

      const schema = z.object({
        categories: z
          .array(z.string())
          .length(3)
          .describe("Top 3 category suggestions"),
        primary: z.string().describe("Most likely category"),
      })

      const result = await generateObject({
        model: models.flash,
        schema,
        prompt,
      })

      return {
        categories: result.object.categories,
        primary: result.object.primary,
        store_type,
      }
    } catch (error: any) {
      console.error("suggestCategories error:", error)

      // Fallback categories
      const fallbackCategories =
        store_type === "clothing"
          ? ["accessory", "t-shirt", "other"]
          : ["accessory", "cleaner", "other"]

      return {
        categories: fallbackCategories,
        primary: fallbackCategories[0],
        store_type,
        error: error.message || "Unknown error occurred",
      }
    }
  },
})
