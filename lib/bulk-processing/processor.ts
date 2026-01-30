import { createAdminClient } from "@/lib/supabase/admin"
import { groupImagesByVisualSimilarity } from "./image-grouper"
import { createDraftProducts } from "./product-creator"
import { generateWithRetry, sleep } from "@/lib/nanobanana"

// Constants for parallel processing
const MAX_CONCURRENT_REQUESTS = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

interface BatchConfig {
  generate_lifestyle: boolean
  remove_background: boolean
  create_products: boolean
}

interface ProductGroup {
  id: string
  name: string
  category: string
  mainImage: string
  images: string[]
  processedImages: {
    original: string
    background_removed?: string
    lifestyle?: string
    model_shot?: string
  }[]
}

interface ProcessingResult {
  success: boolean
  productGroups: ProductGroup[]
  errors: { image: string; error: string }[]
  productsCreated: number
}

/**
 * Main entry point for processing a bulk batch
 */
export async function processBulkBatch(
  batchId: string,
  merchantId: string
): Promise<ProcessingResult> {
  const admin = createAdminClient()
  const errors: { image: string; error: string }[] = []
  let processedCount = 0

  try {
    // Get batch details
    const { data: batch, error: batchError } = await admin
      .from("bulk_deal_batches")
      .select("*")
      .eq("id", batchId)
      .single()

    if (batchError || !batch) {
      throw new Error("Batch not found")
    }

    const config = batch.config as BatchConfig
    const sourceUrls = batch.source_urls as string[]

    // Step 1: Update status to analyzing
    await updateBatchStatus(admin, batchId, "analyzing", {
      current_product: "Analyzing images...",
    })

    // Step 2: Group images by visual similarity
    const productGroups = await groupImagesByVisualSimilarity(sourceUrls)

    // Update batch with product groups
    await (admin
      .from("bulk_deal_batches") as any)
      .update({
        product_groups: productGroups,
        status: "processing",
        current_product: `Processing ${productGroups.length} product groups...`,
      })
      .eq("id", batchId)

    // Step 3: Process each product group
    const processedGroups: ProductGroup[] = []

    for (let i = 0; i < productGroups.length; i++) {
      const group = productGroups[i]

      await updateBatchStatus(admin, batchId, "processing", {
        current_product: `Processing: ${group.name} (${i + 1}/${productGroups.length})`,
      })

      // Process images in this group with limited concurrency
      const processedImages = await processGroupImages(
        group.images,
        config,
        merchantId,
        (count) => {
          processedCount += count
          ;(admin
            .from("bulk_deal_batches") as any)
            .update({ processed_count: processedCount })
            .eq("id", batchId)
        },
        (error) => {
          errors.push(error)
          ;(admin
            .from("bulk_deal_batches") as any)
            .update({
              failed_count: errors.length,
              error_log: errors,
            })
            .eq("id", batchId)
        }
      )

      processedGroups.push({
        ...group,
        processedImages,
      })
    }

    // Step 4: Create draft products if enabled
    let productsCreated = 0
    if (config.create_products) {
      await updateBatchStatus(admin, batchId, "processing", {
        current_product: "Creating draft products...",
      })

      productsCreated = await createDraftProducts(
        processedGroups,
        merchantId,
        batchId
      )
    }

    // Step 5: Mark batch as completed
    await (admin
      .from("bulk_deal_batches") as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_product: null,
        processed_count: processedCount,
        product_groups: processedGroups,
      })
      .eq("id", batchId)

    return {
      success: true,
      productGroups: processedGroups,
      errors,
      productsCreated,
    }
  } catch (error: any) {
    console.error("Bulk processing error:", error)

    await (admin
      .from("bulk_deal_batches") as any)
      .update({
        status: "failed",
        error_log: [...errors, { image: "batch", error: error.message }],
      })
      .eq("id", batchId)

    return {
      success: false,
      productGroups: [],
      errors: [...errors, { image: "batch", error: error.message }],
      productsCreated: 0,
    }
  }
}

/**
 * Process images for a product group with limited concurrency
 */
async function processGroupImages(
  images: string[],
  config: BatchConfig,
  merchantId: string,
  onProgress: (count: number) => void,
  onError: (error: { image: string; error: string }) => void
): Promise<ProductGroup["processedImages"]> {
  const results: ProductGroup["processedImages"] = []
  const queue = [...images]
  const inProgress: Promise<void>[] = []

  const processImage = async (imageUrl: string) => {
    const result: ProductGroup["processedImages"][0] = {
      original: imageUrl,
    }

    try {
      // Remove background if enabled
      if (config.remove_background) {
        const bgRemoved = await processWithRetry(async () => {
          const prompt = "Remove background, transparent background, product only, clean cutout"
          return generateWithRetry(prompt, [imageUrl], "1:1")
        })
        result.background_removed = bgRemoved
        await storeGeneratedAsset(
          merchantId,
          "background_removed",
          imageUrl,
          bgRemoved,
          "Background removal"
        )
      }

      // Generate lifestyle shot if enabled
      if (config.generate_lifestyle) {
        const lifestyle = await processWithRetry(async () => {
          const prompt = "Product in urban street scene, lifestyle photography, natural lighting, authentic streetwear vibe"
          return generateWithRetry(prompt, [imageUrl], "3:4")
        })
        result.lifestyle = lifestyle
        await storeGeneratedAsset(
          merchantId,
          "lifestyle",
          imageUrl,
          lifestyle,
          "Lifestyle shot generation"
        )
      }

      results.push(result)
      onProgress(1)
    } catch (error: any) {
      onError({ image: imageUrl, error: error.message })
      results.push(result) // Still add the original
    }
  }

  // Process with limited concurrency
  while (queue.length > 0 || inProgress.length > 0) {
    // Start new tasks up to the limit
    while (queue.length > 0 && inProgress.length < MAX_CONCURRENT_REQUESTS) {
      const imageUrl = queue.shift()!
      const task = processImage(imageUrl)
      inProgress.push(task)

      // Remove completed tasks
      task.finally(() => {
        const idx = inProgress.indexOf(task)
        if (idx !== -1) inProgress.splice(idx, 1)
      })
    }

    // Wait for at least one task to complete
    if (inProgress.length > 0) {
      await Promise.race(inProgress)
    }
  }

  return results
}

/**
 * Retry a function with exponential backoff
 */
async function processWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      console.error(`Attempt ${attempt + 1} failed:`, error.message)

      if (attempt < RETRY_DELAYS.length) {
        const isRetryable =
          error.message?.includes("503") ||
          error.message?.includes("429") ||
          error.message?.includes("500") ||
          error.message?.includes("timeout")

        if (isRetryable) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
      }

      throw error
    }
  }

  throw lastError
}

/**
 * Store a generated asset in the database
 */
async function storeGeneratedAsset(
  merchantId: string,
  assetType: string,
  sourceUrl: string,
  generatedUrl: string,
  prompt: string
): Promise<void> {
  const admin = createAdminClient()

  await (admin.from("generated_assets") as any).insert({
    merchant_id: merchantId,
    asset_type: assetType,
    source_url: sourceUrl,
    generated_url: generatedUrl,
    prompt,
  })
}

/**
 * Update batch status with additional data
 */
async function updateBatchStatus(
  admin: ReturnType<typeof createAdminClient>,
  batchId: string,
  status: string,
  additionalData: Record<string, any> = {}
): Promise<void> {
  await (admin
    .from("bulk_deal_batches") as any)
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    })
    .eq("id", batchId)
}
