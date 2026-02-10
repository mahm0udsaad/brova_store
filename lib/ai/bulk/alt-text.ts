/**
 * Bulk AI Alt-Text Generator
 *
 * Generates accessibility alt-text for product images using vision AI
 * Creates descriptive, SEO-friendly, and accessible alt text in both Arabic and English
 */

import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"
import { createServerClient } from "@/lib/supabase/server"
import type { BulkOperationOptions, BulkItemResult } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

interface ProductImageForAltText {
  productId: string
  imageUrl: string
  productName?: string
  productName_ar?: string
  category?: string
}

interface AltTextResult {
  alt_text_en: string
  alt_text_ar: string
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate alt-text for product images
 */
export async function generateBulkAltText(
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
      type: "alt_text_generation",
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

  // Fetch products with images
  const { data: products, error: productsError } = await supabase
    .from("store_products")
    .select("id, name, name_ar, images")
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

  // Extract product images
  const productImages: ProductImageForAltText[] = []
  for (const product of products) {
    const images = Array.isArray(product.images)
      ? product.images
      : product.images
        ? [product.images]
        : []

    for (const imageUrl of images) {
      if (typeof imageUrl === "string") {
        productImages.push({
          productId: product.id,
          imageUrl,
          productName: product.name,
          productName_ar: product.name_ar || undefined,
        })
      }
    }
  }

  if (productImages.length === 0) {
    await supabase
      .from("bulk_ai_operations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_items: products.length,
      } as any)
      .eq("id", operationId)

    return {
      operationId,
      results: [],
    }
  }

  // Process in batches
  const batchSize = options.batchSize || 3 // Smaller batches for vision API
  const results: BulkItemResult[] = []
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < productImages.length; i += batchSize) {
    const batch = productImages.slice(i, i + batchSize)

    // Process batch sequentially (vision API is slower)
    for (const productImage of batch) {
      try {
        const result = await generateAltText(productImage)

        if (result.success && result.result) {
          results.push(result)
          successCount++

          // TODO: Store alt-text in database
          // Currently, there's no dedicated alt_text column in store_products
          // In production, you'd want to add an image_metadata JSONB column
          console.log(
            `Generated alt-text for ${productImage.imageUrl}:`,
            result.result
          )
        } else {
          results.push({
            itemId: productImage.productId,
            success: false,
            error: result.error || "Unknown error",
          })
          failedCount++
        }
      } catch (error: any) {
        results.push({
          itemId: productImage.productId,
          success: false,
          error: error.message,
        })
        failedCount++
      }
    }

    // Update operation progress
    await supabase
      .from("bulk_ai_operations")
      .update({
        processed_items: Math.min(i + batchSize, productImages.length),
        success_count: successCount,
        failed_count: failedCount,
        results: results as any,
      } as any)
      .eq("id", operationId)

    // Rate limiting delay (vision API is expensive)
    if (i + batchSize < productImages.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Mark operation as completed
  await supabase
    .from("bulk_ai_operations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      processed_items: productImages.length,
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
 * Generate alt-text for a single image
 */
async function generateAltText(
  productImage: ProductImageForAltText
): Promise<BulkItemResult & { result?: AltTextResult }> {
  const prompt = `You are an accessibility expert. Analyze this product image and generate descriptive alt-text for web accessibility and SEO.

Product Context:
${productImage.productName ? `- Product Name: ${productImage.productName}` : ""}
${productImage.productName_ar ? `- Product Name (Arabic): ${productImage.productName_ar}` : ""}
${productImage.category ? `- Category: ${productImage.category}` : ""}

Generate two versions of alt-text:
1. English (max 125 characters) - Describe what's in the image concisely
2. Arabic (max 125 characters) - Natural Arabic description for Saudi audience

Best Practices:
- Describe the product, its features, colors, and context
- Include relevant keywords naturally
- Be specific but concise
- Avoid phrases like "image of" or "picture of"
- For Arabic: Use natural phrasing, culturally appropriate

Return as JSON:
{
  "alt_text_en": "...",
  "alt_text_ar": "..."
}`

  try {
    // Use vision model to analyze image
    const result = await generateText({
      model: models.vision,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              image: productImage.imageUrl,
            },
          ],
        },
      ],
      maxOutputTokens: 300,
    })

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON")
    }

    const parsed: AltTextResult = JSON.parse(jsonMatch[0])

    // Validate result
    if (!parsed.alt_text_en || !parsed.alt_text_ar) {
      throw new Error("Incomplete alt-text generated")
    }

    // Validate lengths
    if (parsed.alt_text_en.length > 125) {
      parsed.alt_text_en = parsed.alt_text_en.substring(0, 122) + "..."
    }
    if (parsed.alt_text_ar.length > 125) {
      parsed.alt_text_ar = parsed.alt_text_ar.substring(0, 122) + "..."
    }

    return {
      itemId: productImage.productId,
      success: true,
      result: parsed,
      tokensUsed: result.usage?.totalTokens || 0,
    }
  } catch (error: any) {
    return {
      itemId: productImage.productId,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get operation status
 */
export async function getAltTextOperationStatus(operationId: string): Promise<{
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
