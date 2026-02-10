/**
 * Bulk AI Translations
 *
 * Translates product content between Arabic and English using Gemini Flash
 * Maintains cultural context and e-commerce best practices
 */

import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"
import { createServerClient } from "@/lib/supabase/server"
import type { BulkOperationOptions, BulkItemResult } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

interface ProductForTranslation {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  short_description?: string
}

interface TranslationResult {
  name?: string
  name_ar?: string
  description?: string
  description_ar?: string
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Translate product content in bulk
 */
export async function generateBulkTranslations(
  storeId: string,
  productIds: string[],
  options: BulkOperationOptions = {}
): Promise<{
  operationId: string
  results: BulkItemResult[]
}> {
  const supabase = await createServerClient()
  const targetLanguage = options.targetLanguage || "ar" // Default to Arabic

  // Create operation record
  const { data: operation, error: opError } = await supabase
    .from("bulk_ai_operations")
    .insert({
      store_id: storeId,
      type: "translation",
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
    .select("id, name, name_ar, description, description_ar, short_description")
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
        translateProduct(product, targetLanguage).catch((error) => ({
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
        const translation = result.result as TranslationResult

        // Update product in database
        const updateData: any = {}
        if (translation.name) updateData.name = translation.name
        if (translation.name_ar) updateData.name_ar = translation.name_ar
        if (translation.description) updateData.description = translation.description
        if (translation.description_ar)
          updateData.description_ar = translation.description_ar

        const { error: updateError } = await supabase
          .from("store_products")
          .update(updateData)
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
            result: translation,
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
 * Translate a single product
 */
async function translateProduct(
  product: ProductForTranslation,
  targetLanguage: "ar" | "en"
): Promise<BulkItemResult & { result?: TranslationResult }> {
  // Determine what needs translation
  const toTranslate: string[] = []
  const fields: string[] = []

  if (targetLanguage === "ar") {
    // Translate to Arabic
    if (product.name && !product.name_ar) {
      toTranslate.push(product.name)
      fields.push("name")
    }
    if (product.description && !product.description_ar) {
      toTranslate.push(product.description)
      fields.push("description")
    }
  } else {
    // Translate to English
    if (product.name_ar && !product.name) {
      toTranslate.push(product.name_ar)
      fields.push("name_ar")
    }
    if (product.description_ar && !product.description) {
      toTranslate.push(product.description_ar)
      fields.push("description_ar")
    }
  }

  // Nothing to translate
  if (toTranslate.length === 0) {
    return {
      itemId: product.id,
      success: true,
      result: {},
      tokensUsed: 0,
    }
  }

  const sourceLanguage = targetLanguage === "ar" ? "English" : "Arabic"
  const targetLanguageName = targetLanguage === "ar" ? "Arabic" : "English"

  const prompt = `Translate the following e-commerce product content from ${sourceLanguage} to ${targetLanguageName}.

Context: This is for a Saudi Arabian e-commerce platform. Maintain:
- Natural, conversational tone
- E-commerce best practices
- Cultural appropriateness for Saudi Arabia
- SEO-friendly language

Content to translate:
${toTranslate.map((text, i) => `${i + 1}. ${text}`).join("\n\n")}

Return as JSON array with translations in the same order:
${targetLanguage === "ar" ? '["Arabic translation 1", "Arabic translation 2", ...]' : '["English translation 1", "English translation 2", ...]'}`

  try {
    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 1000,
    })

    // Parse JSON response
    const jsonMatch = result.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON")
    }

    const translations: string[] = JSON.parse(jsonMatch[0])

    if (translations.length !== toTranslate.length) {
      throw new Error("Translation count mismatch")
    }

    // Build result
    const translationResult: TranslationResult = {}

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const translation = translations[i]

      if (field === "name" && targetLanguage === "ar") {
        translationResult.name_ar = translation
      } else if (field === "name_ar" && targetLanguage === "en") {
        translationResult.name = translation
      } else if (field === "description" && targetLanguage === "ar") {
        translationResult.description_ar = translation
      } else if (field === "description_ar" && targetLanguage === "en") {
        translationResult.description = translation
      }
    }

    return {
      itemId: product.id,
      success: true,
      result: translationResult,
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
export async function getTranslationOperationStatus(operationId: string): Promise<{
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
