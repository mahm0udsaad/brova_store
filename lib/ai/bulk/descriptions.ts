/**
 * Bulk AI Descriptions Generator
 *
 * Generates product descriptions in Arabic and English using Gemini Flash
 * Processes products in batches with progress tracking
 */

import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"
import { createServerClient } from "@/lib/supabase/server"
import type { BulkOperationOptions, BulkItemResult } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

interface ProductForDescription {
  id: string
  name: string
  name_ar?: string
  short_description?: string
  category?: string
}

interface DescriptionResult {
  description_en: string
  description_ar: string
  short_description_en: string
  short_description_ar: string
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate descriptions for multiple products
 */
export async function generateBulkDescriptions(
  storeId: string,
  productIds: string[],
  options: BulkOperationOptions = {}
): Promise<{
  operationId: string
  results: BulkItemResult[]
}> {
  const supabase = await createServerClient()

  // Create operation record
  const { data: operation, error: opError } = await supabase
    .from("bulk_ai_operations")
    .insert({
      store_id: storeId,
      type: "description_generation",
      total_items: productIds.length,
      status: "processing",
      options: options as any,
      processed_items: 0,
      success_count: 0,
      failed_count: 0,
      started_at: new Date().toISOString(),
    } as any)
    .select()
    .single()

  if (opError) {
    throw new Error(`Failed to create operation: ${opError.message}`)
  }

  const operationId = operation.id

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from("store_products")
    .select("id, name, name_ar, short_description")
    .eq("store_id", storeId)
    .in("id", productIds)

  if (productsError) {
    await supabase
      .from("bulk_ai_operations")
      .update({
        status: "failed",
        error: productsError.message,
      } as any)
      .eq("id", operationId)

    throw new Error(`Failed to fetch products: ${productsError.message}`)
  }

  if (!products || products.length === 0) {
    await supabase
      .from("bulk_ai_operations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      } as any)
      .eq("id", operationId)

    return {
      operationId,
      results: [],
    }
  }

  // Process in batches
  const batchSize = options.batchSize || 5
  const results: BulkItemResult[] = []
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((product) =>
        generateDescription(product, options).catch((error) => ({
          success: false,
          error: error.message,
        }))
      )
    )

    // Update products and collect results
    for (let j = 0; j < batch.length; j++) {
      const product = batch[j]
      const result = batchResults[j]

      if (result.success && "result" in result && result.result) {
        const desc = result.result as DescriptionResult

        // Update product in database
        const { error: updateError } = await supabase
          .from("store_products")
          .update({
            description: desc.description_en,
            description_ar: desc.description_ar,
            short_description: desc.short_description_en,
          })
          .eq("id", product.id)

        if (updateError) {
          results.push({
            itemId: product.id,
            success: false,
            error: updateError.message,
          })
          failedCount++
        } else {
          results.push({
            itemId: product.id,
            success: true,
            result: desc,
            tokensUsed: result.tokensUsed,
          })
          successCount++
        }
      } else {
        results.push({
          itemId: product.id,
          success: false,
          error: result.error || "Unknown error",
        })
        failedCount++
      }
    }

    // Update operation progress
    await supabase
      .from("bulk_ai_operations")
      .update({
        processed_items: i + batch.length,
        success_count: successCount,
        failed_count: failedCount,
        results: results as any,
      } as any)
      .eq("id", operationId)

    // Rate limiting delay (100ms between batches)
    if (i + batchSize < products.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Mark operation as completed
  await supabase
    .from("bulk_ai_operations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      processed_items: products.length,
      success_count: successCount,
      failed_count: failedCount,
      results: results as any,
    } as any)
    .eq("id", operationId)

  return {
    operationId,
    results,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate description for a single product
 */
async function generateDescription(
  product: ProductForDescription,
  options: BulkOperationOptions
): Promise<BulkItemResult & { result?: DescriptionResult }> {
  const tone = options.tone || "professional"
  const maxLength = options.maxLength || 500
  const includeEmojis = options.includeEmojis ?? false

  const prompt = `Generate compelling product descriptions in both English and Arabic for an e-commerce store.

Product Name: ${product.name}
${product.name_ar ? `Product Name (Arabic): ${product.name_ar}` : ""}
${product.short_description ? `Brief: ${product.short_description}` : ""}
${product.category ? `Category: ${product.category}` : ""}

Requirements:
- Tone: ${tone}
- Maximum length: ${maxLength} characters per description
${includeEmojis ? "- Include relevant emojis" : "- No emojis"}
- Highlight key features and benefits
- Use persuasive language to drive conversions
- Arabic should be natural and culturally appropriate for Saudi Arabia

Generate:
1. Full description in English (${maxLength} chars max)
2. Full description in Arabic (${maxLength} chars max)
3. Short description in English (100 chars max)
4. Short description in Arabic (100 chars max)

Return as JSON:
{
  "description_en": "...",
  "description_ar": "...",
  "short_description_en": "...",
  "short_description_ar": "..."
}`

  try {
    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 800,
    })

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON")
    }

    const parsed: DescriptionResult = JSON.parse(jsonMatch[0])

    // Validate result
    if (
      !parsed.description_en ||
      !parsed.description_ar ||
      !parsed.short_description_en ||
      !parsed.short_description_ar
    ) {
      throw new Error("Incomplete description generated")
    }

    return {
      itemId: product.id,
      success: true,
      result: parsed,
      tokensUsed: result.usage?.totalTokens || 0,
    }
  } catch (error: any) {
    return {
      itemId: product.id,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get operation status
 */
export async function getDescriptionOperationStatus(operationId: string): Promise<{
  status: string
  progress: number
  results?: BulkItemResult[]
  error?: string
}> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("bulk_ai_operations")
    .select("*")
    .eq("id", operationId)
    .single()

  if (error || !data) {
    throw new Error(`Operation not found: ${operationId}`)
  }

  const progress =
    data.total_items > 0
      ? ((data.processed_items || 0) / data.total_items) * 100
      : 0

  return {
    status: data.status,
    progress,
    results: data.results ? (data.results as any) : undefined,
    error: data.error || undefined,
  }
}
