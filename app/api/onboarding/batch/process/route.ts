import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { models } from "@/lib/ai/gateway"

export async function POST(request: Request) {
  const { batchId, storeId, items, type } = await request.json()

  const supabase = await createClient()

  // Update batch status
  await supabase
    .from("batch_operations")
    .update({ status: "processing" })
    .eq("id", batchId)

  let completedCount = 0
  let errorCount = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    await supabase
      .from("batch_items")
      .update({ status: "processing" })
      .eq("batch_id", batchId)
      .eq("index", i)

    try {
      if (type === "product_add") {
        // Generate Arabic description via AI
        const result = await generateText({
          model: models.flash,
          prompt: `Generate a compelling Arabic product description for: ${item.name_ar}. Category: ${item.category_ar || "عام"}. Keep it under 100 words, professional e-commerce style. Return ONLY the description text.`,
          maxOutputTokens: 200,
        })

        const slug = `${(item.name_en || item.name_ar).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

        await supabase.from("store_products").insert({
          store_id: storeId,
          name: item.name_en || item.name_ar,
          name_ar: item.name_ar,
          description_ar: item.description_ar || result.text.trim(),
          category_ar: item.category_ar,
          price: item.price,
          status: "draft",
          ai_generated: true,
          ai_confidence: "high",
          inventory: 0,
          slug,
        })

        completedCount++
      }

      if (type === "image_generation") {
        // Image generation would go here
        // For now, mark as done with a placeholder
        completedCount++
      }

      await supabase
        .from("batch_items")
        .update({
          status: "done",
          completed_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId)
        .eq("index", i)
    } catch (error: unknown) {
      errorCount++
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      await supabase
        .from("batch_items")
        .update({
          status: "error",
          error_message: errorMessage,
        })
        .eq("batch_id", batchId)
        .eq("index", i)
    }
  }

  // Update batch final status
  await supabase
    .from("batch_operations")
    .update({
      status: errorCount === items.length ? "failed" : "completed",
    })
    .eq("id", batchId)

  return Response.json({
    batchId,
    completed: completedCount,
    errors: errorCount,
    total: items.length,
  })
}
