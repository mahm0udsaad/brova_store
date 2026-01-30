import { createClient } from "@/lib/supabase/server"
import { generateWithRetry, uploadImageToSupabase } from "@/lib/nanobanana"
import { BaseAgent } from "./base-agent"
import type { AgentResult, ImageGenerateParams } from "./types"

// Style prompts for different image styles
const STYLE_PROMPTS: Record<string, string> = {
  clean: "Clean white background, professional product photography, studio lighting, high resolution",
  lifestyle: "Lifestyle photography, natural lighting, urban environment, streetwear aesthetic",
  studio: "Professional studio shot, dramatic lighting, fashion photography style",
  urban: "Urban street photography, graffiti background, authentic streetwear vibe",
}

export class PhotographerAgent extends BaseAgent {
  constructor(userId: string) {
    super(userId, "photographer")
  }

  /**
   * Execute a photography-related action
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    switch (action) {
      case "generate_image":
        return this.generateImage(params as ImageGenerateParams)
      case "remove_background":
        return this.removeBackground(params.imageUrl)
      case "generate_lifestyle":
        return this.generateLifestyleShot(params as { productImageUrl: string; setting?: string })
      case "generate_model_shot":
        return this.generateModelShot(params as { productImageUrl: string; modelType?: "male" | "female" | "neutral" })
      case "generate_showcase":
        return this.generateShowcase(params as { imageUrl: string; count?: number; style?: "clean" | "studio" | "minimal" })
      case "batch_process":
        return this.batchProcess(params as { imageUrls: string[]; operations: string[] })
      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
          error: "Invalid action",
        }
    }
  }

  /**
   * Generate an image using NanoBanana API
   */
  private async generateImage(params: ImageGenerateParams): Promise<AgentResult> {
    try {
      // Check usage limits first
      const limitCheck = await this.checkUsageLimit()
      if (!limitCheck.allowed) {
        return {
          success: false,
          message: "Daily image generation limit reached",
          error: limitCheck.message,
        }
      }

      const stylePrompt = STYLE_PROMPTS[params.style || "clean"] || STYLE_PROMPTS.clean
      const fullPrompt = `${params.prompt}. ${stylePrompt}`

      const imageUrls = params.sourceImages || []
      const imageSize = params.imageSize || "3:4"

      const resultUrl = await generateWithRetry(fullPrompt, imageUrls, imageSize)

      // Store the generated asset
      const supabase = await createClient()
      const { data: asset } = await supabase
        .from("generated_assets")
        .insert({
          merchant_id: this.userId,
          asset_type: "product_image",
          source_url: imageUrls[0] || null,
          generated_url: resultUrl,
          prompt: fullPrompt,
          metadata: { style: params.style, imageSize },
        })
        .select()
        .single()

      // Track usage
      await this.trackUsage("image_generation", 1)

      return {
        success: true,
        message: "Image generated successfully",
        data: { imageUrl: resultUrl, asset },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate image",
        error: error.message,
      }
    }
  }

  /**
   * Remove background from an image
   */
  private async removeBackground(imageUrl: string): Promise<AgentResult> {
    try {
      const limitCheck = await this.checkUsageLimit()
      if (!limitCheck.allowed) {
        return {
          success: false,
          message: "Daily image generation limit reached",
          error: limitCheck.message,
        }
      }

      const prompt = "Remove background, transparent background, product only, clean cutout"
      const resultUrl = await generateWithRetry(prompt, [imageUrl], "1:1")

      // Store the generated asset
      const supabase = await createClient()
      const { data: asset } = await supabase
        .from("generated_assets")
        .insert({
          merchant_id: this.userId,
          asset_type: "background_removed",
          source_url: imageUrl,
          generated_url: resultUrl,
          prompt,
        })
        .select()
        .single()

      await this.trackUsage("image_generation", 1)

      return {
        success: true,
        message: "Background removed successfully",
        data: { imageUrl: resultUrl, asset },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to remove background",
        error: error.message,
      }
    }
  }

  /**
   * Generate a lifestyle shot for a product
   */
  private async generateLifestyleShot(params: {
    productImageUrl: string
    setting?: string
  }): Promise<AgentResult> {
    try {
      const setting = params.setting || "urban street scene"
      const prompt = `Product in ${setting}, lifestyle photography, natural lighting, model wearing/using product, authentic streetwear vibe, high fashion editorial`

      const resultUrl = await generateWithRetry(prompt, [params.productImageUrl], "3:4")

      const supabase = await createClient()
      const { data: asset } = await supabase
        .from("generated_assets")
        .insert({
          merchant_id: this.userId,
          asset_type: "lifestyle",
          source_url: params.productImageUrl,
          generated_url: resultUrl,
          prompt,
          metadata: { setting },
        })
        .select()
        .single()

      await this.trackUsage("image_generation", 1)

      return {
        success: true,
        message: "Lifestyle shot generated",
        data: { imageUrl: resultUrl, asset },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate lifestyle shot",
        error: error.message,
      }
    }
  }

  /**
   * Generate a model try-on shot
   */
  private async generateModelShot(params: {
    productImageUrl: string
    modelType?: "male" | "female" | "neutral"
  }): Promise<AgentResult> {
    try {
      const modelType = params.modelType || "neutral"
      const prompt = `${modelType} fashion model wearing the product, professional fashion photography, studio lighting, full body shot, streetwear editorial style`

      const resultUrl = await generateWithRetry(prompt, [params.productImageUrl], "3:4")

      const supabase = await createClient()
      const { data: asset } = await supabase
        .from("generated_assets")
        .insert({
          merchant_id: this.userId,
          asset_type: "model_shot",
          source_url: params.productImageUrl,
          generated_url: resultUrl,
          prompt,
          metadata: { modelType },
        })
        .select()
        .single()

      await this.trackUsage("image_generation", 1)

      return {
        success: true,
        message: "Model shot generated",
        data: { imageUrl: resultUrl, asset },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate model shot",
        error: error.message,
      }
    }
  }

  /**
   * Generate product showcase - creates 3-4 variations with clean backgrounds
   */
  private async generateShowcase(params: {
    imageUrl: string
    count?: number
    style?: "clean" | "studio" | "minimal"
  }): Promise<AgentResult> {
    try {
      const count = params.count || 4
      const style = params.style || "clean"
      const limitCheck = await this.checkUsageLimit()
      
      if (!limitCheck.allowed) {
        return {
          success: false,
          message: "Daily image generation limit reached",
          error: limitCheck.message,
        }
      }

      const showcaseVariations = [
        {
          name: "clean_white",
          prompt: "Professional product photography, clean white background, studio lighting, centered composition, high resolution, commercial quality",
        },
        {
          name: "clean_grey",
          prompt: "Professional product photography, soft grey background, even lighting, minimalist aesthetic, high quality, clean studio shot",
        },
        {
          name: "studio_dramatic",
          prompt: "Professional studio photography, subtle gradient background, dramatic side lighting, depth and dimension, premium quality",
        },
        {
          name: "studio_soft",
          prompt: "Professional studio shot, soft diffused lighting, neutral background with subtle texture, editorial quality, modern aesthetic",
        },
      ]

      const generatedImages: any[] = []
      const variations = showcaseVariations.slice(0, count)

      for (const variation of variations) {
        try {
          const resultUrl = await generateWithRetry(
            variation.prompt,
            [params.imageUrl],
            "1:1"
          )

          // Store the generated asset
          const supabase = await createClient()
          const { data: asset } = await supabase
            .from("generated_assets")
            .insert({
              merchant_id: this.userId,
              asset_type: "showcase",
              source_url: params.imageUrl,
              generated_url: resultUrl,
              prompt: variation.prompt,
              metadata: { 
                style,
                variation: variation.name,
                isShowcase: true,
              },
            })
            .select()
            .single()

          generatedImages.push({
            variation: variation.name,
            url: resultUrl,
            asset,
          })

          await this.trackUsage("image_generation", 1)
        } catch (error: any) {
          console.error(`Failed to generate ${variation.name}:`, error)
        }
      }

      if (generatedImages.length === 0) {
        return {
          success: false,
          message: "Failed to generate any showcase images",
          error: "All generations failed",
        }
      }

      return {
        success: true,
        message: `Generated ${generatedImages.length} showcase variations`,
        data: { 
          images: generatedImages,
          count: generatedImages.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate showcase",
        error: error.message,
      }
    }
  }

  /**
   * Batch process multiple images
   */
  private async batchProcess(params: {
    imageUrls: string[]
    operations: string[] // e.g., ["remove_background", "generate_lifestyle"]
  }): Promise<AgentResult> {
    const results: any[] = []
    const errors: any[] = []

    for (const imageUrl of params.imageUrls) {
      for (const operation of params.operations) {
        try {
          let result: AgentResult

          switch (operation) {
            case "remove_background":
              result = await this.removeBackground(imageUrl)
              break
            case "generate_lifestyle":
              result = await this.generateLifestyleShot({ productImageUrl: imageUrl })
              break
            case "generate_model_shot":
              result = await this.generateModelShot({ productImageUrl: imageUrl })
              break
            default:
              continue
          }

          if (result.success) {
            results.push({ imageUrl, operation, result: result.data })
          } else {
            errors.push({ imageUrl, operation, error: result.error })
          }
        } catch (error: any) {
          errors.push({ imageUrl, operation, error: error.message })
        }
      }
    }

    return {
      success: errors.length === 0,
      message: `Processed ${results.length} operations with ${errors.length} errors`,
      data: { results, errors },
    }
  }

  /**
   * Check if user has remaining usage allowance
   */
  private async checkUsageLimit(): Promise<{ allowed: boolean; message?: string }> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split("T")[0]

      // Get today's usage
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("count")
        .eq("merchant_id", this.userId)
        .eq("operation", "image_generation")
        .eq("date", today)
        .single()

      // Get user's limit from settings
      const { data: settings } = await supabase
        .from("store_settings")
        .select("ai_preferences")
        .eq("merchant_id", this.userId)
        .single()

      const limit = settings?.ai_preferences?.daily_limits?.image_generation || 100
      const currentUsage = usage?.count || 0

      if (currentUsage >= limit) {
        return {
          allowed: false,
          message: `Daily limit of ${limit} images reached`,
        }
      }

      return { allowed: true }
    } catch (error) {
      // If we can't check, allow the operation
      return { allowed: true }
    }
  }

  /**
   * Track usage for billing/limits
   */
  private async trackUsage(operation: string, count: number): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split("T")[0]

      // Upsert usage record
      await supabase.rpc("increment_ai_usage", {
        p_merchant_id: this.userId,
        p_operation: operation,
        p_count: count,
        p_tokens: 0,
        p_cost: count * 0.01, // Estimated cost per image
      })
    } catch (error) {
      console.error("Failed to track usage:", error)
    }
  }
}
