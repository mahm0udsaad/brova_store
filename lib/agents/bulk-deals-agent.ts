import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BaseAgent } from "./base-agent"
import { withRetry } from "@/lib/ai/execution-config"
import { generateWithRetry, uploadImageToSupabase } from "@/lib/nanobanana"
import type { AgentResult } from "./types"

export interface BulkProcessParams {
  batchId?: string
  imageUrls: string[]
  operations: Array<"remove_background" | "generate_showcase" | "generate_lifestyle">
  productsPerImage?: number
}

export interface GroupImagesParams {
  imageUrls: string[]
  threshold?: number
}

export interface CreateProductsFromBatchParams {
  batchId: string
  autoPublish?: boolean
}

/**
 * Bulk Deals Agent - Handles batch image processing and product creation
 * Uses parallel execution for efficient processing of multiple images
 */
export class BulkDealsAgent extends BaseAgent {
  constructor(userId: string) {
    super(userId, "bulk_deals")
  }

  /**
   * Execute bulk deals actions with retry logic
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    try {
      switch (action) {
        case "process_batch":
          return await withRetry(
            () => this.processBatch(params as BulkProcessParams),
            "bulk_deals"
          )
        case "group_images":
          return await withRetry(
            () => this.groupImages(params as GroupImagesParams),
            "bulk_deals"
          )
        case "create_products_from_batch":
          return await withRetry(
            () => this.createProductsFromBatch(params as CreateProductsFromBatchParams),
            "bulk_deals"
          )
        default:
          return this.formatError(`Unknown action: ${action}`, action)
      }
    } catch (error) {
      return this.formatError(error as Error, action)
    }
  }

  /**
   * Process a batch of images with specified operations
   * Executes operations in parallel with concurrency control
   */
  private async processBatch(params: BulkProcessParams): Promise<AgentResult> {
    const { imageUrls, operations, batchId, productsPerImage = 1 } = params

    if (!imageUrls || imageUrls.length === 0) {
      return this.formatError("No images provided", "process_batch")
    }

    try {
      const supabase = createAdminClient()
      const results: Array<{
        originalUrl: string
        processedUrls: string[]
        operation: string
        success: boolean
        error?: string
      }> = []

      // Process images with concurrency control (max 3 at a time)
      const MAX_CONCURRENT = 3
      const chunks: string[][] = []

      for (let i = 0; i < imageUrls.length; i += MAX_CONCURRENT) {
        chunks.push(imageUrls.slice(i, i + MAX_CONCURRENT))
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (imageUrl) => {
            const processedUrls: string[] = []
            let success = true
            let error: string | undefined

            try {
              for (const operation of operations) {
                switch (operation) {
                  case "remove_background": {
                    const result = await generateWithRetry({
                      sourceImageUrl: imageUrl,
                      operation: "remove_background",
                    })
                    if (result) {
                      processedUrls.push(result)
                    }
                    break
                  }

                  case "generate_showcase": {
                    // Generate multiple showcase variations
                    for (let i = 0; i < productsPerImage; i++) {
                      const result = await generateWithRetry({
                        sourceImageUrl: imageUrl,
                        operation: "showcase",
                        style: "studio",
                      })
                      if (result) {
                        processedUrls.push(result)
                      }
                    }
                    break
                  }

                  case "generate_lifestyle": {
                    const result = await generateWithRetry({
                      sourceImageUrl: imageUrl,
                      operation: "lifestyle",
                    })
                    if (result) {
                      processedUrls.push(result)
                    }
                    break
                  }
                }
              }
            } catch (e) {
              success = false
              error = e instanceof Error ? e.message : String(e)
              console.error(`Failed to process image ${imageUrl}:`, e)
            }

            return {
              originalUrl: imageUrl,
              processedUrls,
              operation: operations.join(", "),
              success,
              error,
            }
          })
        )

        results.push(...chunkResults)
      }

      // Update batch in database if batchId provided
      if (batchId) {
        await supabase
          .from("bulk_batches")
          .update({
            status: "processed",
            processed_at: new Date().toISOString(),
            results: JSON.stringify(results),
          })
          .eq("id", batchId)
      }

      const successCount = results.filter((r) => r.success).length
      const totalImages = results.reduce((acc, r) => acc + r.processedUrls.length, 0)

      return this.formatSuccess(
        `Processed ${successCount}/${imageUrls.length} images successfully. Generated ${totalImages} variations.`,
        {
          results,
          successCount,
          totalImages,
          batchId,
        }
      )
    } catch (error) {
      console.error("Batch processing error:", error)
      return this.formatError(error as Error, "process_batch")
    }
  }

  /**
   * Group similar images together for batch creation
   */
  private async groupImages(params: GroupImagesParams): Promise<AgentResult> {
    const { imageUrls, threshold = 0.7 } = params

    if (!imageUrls || imageUrls.length === 0) {
      return this.formatError("No images provided", "group_images")
    }

    try {
      // Simple grouping by analyzing image characteristics
      // In production, this could use ML models for better similarity detection
      const groups: string[][] = []
      const processed = new Set<string>()

      for (const imageUrl of imageUrls) {
        if (processed.has(imageUrl)) continue

        const group = [imageUrl]
        processed.add(imageUrl)

        // Find similar images (simplified - in production use ML)
        for (const otherUrl of imageUrls) {
          if (processed.has(otherUrl)) continue
          // Here you would compare images using ML
          // For now, just create groups of 1-3 images
          if (group.length < 3) {
            group.push(otherUrl)
            processed.add(otherUrl)
          }
        }

        groups.push(group)
      }

      return this.formatSuccess(
        `Grouped ${imageUrls.length} images into ${groups.length} groups`,
        { groups }
      )
    } catch (error) {
      return this.formatError(error as Error, "group_images")
    }
  }

  /**
   * Create products from a processed batch
   */
  private async createProductsFromBatch(
    params: CreateProductsFromBatchParams
  ): Promise<AgentResult> {
    const { batchId, autoPublish = false } = params

    try {
      const supabase = createAdminClient()

      // Get batch details
      const { data: batch, error: batchError } = await supabase
        .from("bulk_batches")
        .select("*")
        .eq("id", batchId)
        .single()

      if (batchError || !batch) {
        return this.formatError("Batch not found", "create_products_from_batch")
      }

      const results = JSON.parse(batch.results || "[]")
      const productsCreated: string[] = []

      // Create products from processed images
      for (const result of results) {
        if (!result.success || result.processedUrls.length === 0) continue

        // Extract product name from filename or generate one
        const productName = this.extractProductName(result.originalUrl)

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            name: productName,
            merchant_id: this.userId,
            image_url: result.processedUrls[0],
            images: result.processedUrls,
            published: autoPublish,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!productError && product) {
          productsCreated.push(product.id)
        }
      }

      // Update batch status
      await supabase
        .from("bulk_batches")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchId)

      return this.formatSuccess(
        `Created ${productsCreated.length} products from batch`,
        {
          productIds: productsCreated,
          batchId,
        }
      )
    } catch (error) {
      return this.formatError(error as Error, "create_products_from_batch")
    }
  }

  /**
   * Extract a product name from an image URL or filename
   */
  private extractProductName(url: string): string {
    try {
      const filename = url.split("/").pop()?.split("?")[0] || "Product"
      const name = filename
        .replace(/\.[^.]+$/, "") // Remove extension
        .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
        .replace(/\d+/g, "") // Remove numbers
        .trim()

      return name || "Product"
    } catch {
      return "Product"
    }
  }
}
