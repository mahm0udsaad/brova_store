import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const bulkAddProductsTool = tool({
  description:
    "Add multiple products to the store at once. Products are queued for async one-by-one processing. Use when the user provides multiple products or uploads a file.",

  inputSchema: z.object({
    products: z
      .array(
        z.object({
          name_ar: z.string().describe("Product name in Arabic"),
          name_en: z.string().optional().describe("Product name in English"),
          price: z.number().describe("Product price"),
          currency: z
            .enum(["SAR", "EGP", "AED", "KWD", "USD"])
            .default("SAR"),
          category_ar: z.string().optional().describe("Category in Arabic"),
          description_ar: z
            .string()
            .optional()
            .describe("Description in Arabic"),
          imagePrompt: z
            .string()
            .optional()
            .describe("Prompt for AI image generation"),
        })
      )
      .describe("Array of products to add"),
    storeId: z.string().describe("Store ID"),
    sessionId: z.string().optional().describe("Onboarding session ID"),
  }),

  execute: async ({ products, storeId, sessionId }) => {
    const supabase = await createClient()
    const batchId = crypto.randomUUID()
    const totalCount = products.length

    // Create batch operation record
    const { error: batchError } = await supabase
      .from("batch_operations")
      .insert({
        id: batchId,
        store_id: storeId,
        session_id: sessionId || null,
        type: "product_add",
        total_count: totalCount,
        status: "queued",
      })

    if (batchError) {
      return {
        batchId: null,
        totalCount,
        status: "error" as const,
        error: batchError.message,
        message_ar: "فشل في إنشاء عملية الدفعة",
        products: [],
      }
    }

    // Create batch items
    const items = products.map((p, i) => ({
      batch_id: batchId,
      index: i,
      input_data: p,
      status: "pending" as const,
    }))

    await supabase.from("batch_items").insert(items)

    // Trigger async processing (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/onboarding/batch/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, storeId, items: products, type: "product_add" }),
    }).catch((err) => console.error("Failed to trigger batch processing:", err))

    return {
      batchId,
      totalCount,
      status: "queued" as const,
      message_ar: `تم استلام ${totalCount} منتج. جارِ المعالجة...`,
      products: products.map((p, i) => ({
        index: i,
        name_ar: p.name_ar,
        status: "pending" as const,
      })),
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.status === "queued"
      ? `Bulk operation started. Batch ID: ${output.batchId}. ${output.totalCount} products queued.`
      : `Failed: ${output.error}`,
  }),
})
