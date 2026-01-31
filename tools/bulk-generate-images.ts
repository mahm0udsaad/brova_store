import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const bulkGenerateImagesTool = tool({
  description:
    "Generate AI images for multiple products or store sections. Images are queued for async one-by-one processing.",

  inputSchema: z.object({
    items: z
      .array(
        z.object({
          targetId: z
            .string()
            .describe("ID of the product or component to attach the image to"),
          targetType: z
            .enum(["product", "component"])
            .describe("Whether this is for a product or store component"),
          prompt: z.string().describe("Image generation prompt in English"),
          style: z
            .enum([
              "product_photo",
              "banner",
              "lifestyle",
              "flat_lay",
              "minimal",
            ])
            .default("product_photo"),
        })
      )
      .describe("Array of image generation requests"),
    storeId: z.string().describe("Store ID"),
  }),

  execute: async ({ items, storeId }) => {
    const supabase = await createClient()
    const batchId = crypto.randomUUID()

    // Create batch operation record
    await supabase.from("batch_operations").insert({
      id: batchId,
      store_id: storeId,
      type: "image_generation",
      total_count: items.length,
      status: "queued",
    })

    // Create batch items
    const batchItems = items.map((item, i) => ({
      batch_id: batchId,
      index: i,
      input_data: item,
      status: "pending" as const,
    }))

    await supabase.from("batch_items").insert(batchItems)

    // Trigger async processing
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/onboarding/batch/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        storeId,
        items,
        type: "image_generation",
      }),
    }).catch((err) => console.error("Failed to trigger batch processing:", err))

    return {
      batchId,
      totalCount: items.length,
      status: "queued" as const,
      message_ar: `جارِ إنشاء ${items.length} صورة بالذكاء الاصطناعي...`,
      items: items.map((item, i) => ({
        index: i,
        targetId: item.targetId,
        status: "pending" as const,
      })),
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: `Image generation batch started. Batch: ${output.batchId}. ${output.totalCount} images queued.`,
  }),
})
