/**
 * Bulk AI SEO Generator
 *
 * Generates SEO metadata (meta title, description, keywords) for products
 * Optimized for both Arabic and English search engines
 */

import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"
import { createServerClient } from "@/lib/supabase/server"
import type { BulkOperationOptions, BulkItemResult } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

interface ProductForSEO {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  category?: string
  price?: number
}

interface SEOResult {
  meta_title_en: string
  meta_title_ar: string
  meta_description_en: string
  meta_description_ar: string
  keywords_en: string[]
  keywords_ar: string[]
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate SEO metadata for multiple products
 */
export async function generateBulkSEO(
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
      type: "seo_generation",
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
    .select("id, name, name_ar, description, description_ar, price")
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
        generateSEOMetadata(product).catch((error) => ({
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
        const seo = result.result as SEOResult

        // Store SEO data in JSON column (assuming there's a metadata or seo_data column)
        // For now, we'll store in description fields temporarily
        // In production, you'd want a dedicated seo_metadata JSONB column

        const seoData = {
          meta_title_en: seo.meta_title_en,
          meta_title_ar: seo.meta_title_ar,
          meta_description_en: seo.meta_description_en,
          meta_description_ar: seo.meta_description_ar,
          keywords_en: seo.keywords_en,
          keywords_ar: seo.keywords_ar,
        }

        // TODO: Store in proper SEO metadata column
        // For now, log the SEO data
        console.log(`Generated SEO for product ${product.id}:`, seoData)

        results.push({
          itemId: product.id,
          success: true,
          result: seo,
          tokensUsed: result.tokensUsed,
        })
        successCount++
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

    // Rate limiting delay
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
 * Generate SEO metadata for a single product
 */
async function generateSEOMetadata(
  product: ProductForSEO
): Promise<BulkItemResult & { result?: SEOResult }> {
  const prompt = `Generate SEO metadata for an e-commerce product. Optimize for both Google (English) and Arabic search engines.

Product Information:
- Name: ${product.name}
${product.name_ar ? `- Name (Arabic): ${product.name_ar}` : ""}
${product.description ? `- Description: ${product.description.substring(0, 200)}...` : ""}
${product.description_ar ? `- Description (Arabic): ${product.description_ar.substring(0, 200)}...` : ""}
${product.category ? `- Category: ${product.category}` : ""}
${product.price ? `- Price: ${product.price} SAR` : ""}

Generate:
1. Meta Title (English) - 50-60 characters, include key product features
2. Meta Title (Arabic) - 50-60 characters, natural Arabic phrasing
3. Meta Description (English) - 150-160 characters, compelling call-to-action
4. Meta Description (Arabic) - 150-160 characters, culturally appropriate
5. Keywords (English) - 8-12 relevant keywords
6. Keywords (Arabic) - 8-12 relevant Arabic keywords

Best Practices:
- Include product name, category, and key features
- Use action words and benefits
- Optimize for "Buy [product]" and "Shop [product]" queries
- For Arabic: Use natural language, avoid literal translations
- Target Saudi Arabian market

Return as JSON:
{
  "meta_title_en": "...",
  "meta_title_ar": "...",
  "meta_description_en": "...",
  "meta_description_ar": "...",
  "keywords_en": ["keyword1", "keyword2", ...],
  "keywords_ar": ["كلمة1", "كلمة2", ...]
}`

  try {
    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 700,
    })

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON")
    }

    const parsed: SEOResult = JSON.parse(jsonMatch[0])

    // Validate result
    if (
      !parsed.meta_title_en ||
      !parsed.meta_title_ar ||
      !parsed.meta_description_en ||
      !parsed.meta_description_ar ||
      !Array.isArray(parsed.keywords_en) ||
      !Array.isArray(parsed.keywords_ar)
    ) {
      throw new Error("Incomplete SEO metadata generated")
    }

    // Validate lengths
    if (parsed.meta_title_en.length > 70) {
      parsed.meta_title_en = parsed.meta_title_en.substring(0, 67) + "..."
    }
    if (parsed.meta_title_ar.length > 70) {
      parsed.meta_title_ar = parsed.meta_title_ar.substring(0, 67) + "..."
    }
    if (parsed.meta_description_en.length > 170) {
      parsed.meta_description_en =
        parsed.meta_description_en.substring(0, 167) + "..."
    }
    if (parsed.meta_description_ar.length > 170) {
      parsed.meta_description_ar =
        parsed.meta_description_ar.substring(0, 167) + "..."
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
export async function getSEOOperationStatus(operationId: string): Promise<{
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
