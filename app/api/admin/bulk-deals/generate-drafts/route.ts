import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { groupImagesByVisualSimilarity } from "@/lib/bulk-processing/image-grouper"
import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Generate draft product objects from batch images.
 *
 * IMPORTANT: This route does NOT persist products to any table.
 * It returns draft product data as JSON for the client to hold in state.
 * Persistence happens only in Task 7 (approval flow).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { batchId } = body

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      )
    }

    // Verify batch belongs to user
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .select("*")
      .eq("id", batchId)
      .eq("merchant_id", user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      )
    }

    // Get all images for this batch
    const { data: batchImages, error: imagesError } = await supabase
      .from("bulk_deal_images")
      .select("*")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true })

    if (imagesError || !batchImages || batchImages.length === 0) {
      return NextResponse.json(
        { error: "No images found in batch" },
        { status: 400 }
      )
    }

    const imageUrls = batchImages
      .map((img) => img.original_url)
      .filter(Boolean) as string[]

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid image URLs found" },
        { status: 400 }
      )
    }

    // Update batch status to analyzing
    await supabase
      .from("bulk_deal_batches")
      .update({
        status: "analyzing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId)

    // Step 1: Group images by visual similarity (reuses existing agent)
    const productGroups = await groupImagesByVisualSimilarity(imageUrls)

    // Step 2: Generate draft product details for each group (reuses existing AI pattern)
    const draftProducts = await Promise.all(
      productGroups.map(async (group) => {
        const details = await generateDraftDetails(group)

        // Collect all image URLs for this draft
        const allImages = [group.mainImage, ...group.images.filter((img) => img !== group.mainImage)]

        return {
          id: `draft_${group.id}_${Date.now()}`,
          groupId: group.id,
          name: details.name || group.name,
          description: details.description || "",
          category: details.category || group.category,
          priceSuggestion: details.priceSuggestion || null,
          sizes: details.sizes || ["S", "M", "L", "XL"],
          gender: details.gender || "unisex",
          images: [...new Set(allImages)],
          mainImage: group.mainImage,
          isDraft: true,
          aiConfidence: details.confidence || "medium",
          createdAt: new Date().toISOString(),
        }
      })
    )

    // Update batch status to processing (drafts generated)
    await supabase
      .from("bulk_deal_batches")
      .update({
        status: "processing",
        product_groups: productGroups,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId)

    // Return draft products as JSON — NOT persisted to any product table
    return NextResponse.json({
      success: true,
      drafts: draftProducts,
      groupCount: productGroups.length,
      imageCount: imageUrls.length,
      batchId,
    })
  } catch (error) {
    console.error("Generate drafts error:", error)
    return NextResponse.json(
      { error: "Failed to generate draft products" },
      { status: 500 }
    )
  }
}

/**
 * Generate draft product details using AI.
 * Reuses the same pattern as the existing generate-details route.
 */
async function generateDraftDetails(group: {
  name: string
  category: string
  images: string[]
}): Promise<{
  name: string
  description: string
  category: string
  priceSuggestion: number | null
  sizes: string[]
  gender: "men" | "women" | "unisex"
  confidence: "high" | "medium" | "low"
}> {
  try {
    const prompt = `Analyze this product from a streetwear store and generate details:

Product Name Hint: ${group.name}
Category Hint: ${group.category}
Number of images: ${group.images.length}

Generate:
1. A refined product name (2-4 words, streetwear-appropriate)
2. A compelling product description (2-3 sentences, Arabic-friendly)
3. Best-fit category (t-shirts, hoodies, pants, jackets, accessories, shoes)
4. Suggested price in EGP (Egyptian Pounds) based on typical streetwear pricing
5. Available sizes
6. Target gender
7. Confidence level in your analysis (high if product is clearly visible, medium if somewhat unclear, low if guessing)

Return as JSON:
{
  "name": "Product Name",
  "description": "Product description",
  "category": "category",
  "priceSuggestion": 450,
  "sizes": ["S", "M", "L", "XL"],
  "gender": "unisex",
  "confidence": "medium"
}

Return ONLY valid JSON.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 400,
    })

    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error("Draft detail generation error:", error)
  }

  // Fallback defaults
  return {
    name: group.name,
    description: `Premium ${group.category} from our streetwear collection. Designed for style and comfort.`,
    category: group.category,
    priceSuggestion: null,
    sizes: ["S", "M", "L", "XL"],
    gender: "unisex",
    confidence: "low",
  }
}
