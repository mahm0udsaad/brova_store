import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/admin"
import { models } from "@/lib/ai/gateway"

interface ProcessedImage {
  original: string
  background_removed?: string
  lifestyle?: string
  model_shot?: string
}

interface ProductGroup {
  id: string
  name: string
  category: string
  mainImage: string
  images: string[]
  processedImages: ProcessedImage[]
}

interface CreatedProduct {
  id: string
  name: string
  category: string
  images: string[]
}

/**
 * Create draft products from processed image groups
 */
export async function createDraftProducts(
  productGroups: ProductGroup[],
  merchantId: string,
  batchId: string
): Promise<number> {
  const admin = createAdminClient()
  let createdCount = 0

  for (const group of productGroups) {
    try {
      // Generate product details using AI
      const productDetails = await generateProductDetails(group)

      // Collect all images (original + processed variants)
      const allImages = collectAllImages(group)

      // Create the product as draft
      const { data: product, error } = await (admin
        .from("products") as any)
        .insert({
          name: productDetails.name || group.name,
          description: productDetails.description,
          category_id: mapCategoryToId(group.category),
          image_url: group.mainImage,
          images: allImages,
          sizes: productDetails.suggestedSizes || ["S", "M", "L", "XL"],
          published: false, // Draft status
          price: null, // Price to be set manually
          gender: productDetails.gender || "unisex",
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating product:", error)
        continue
      }

      // Link generated assets to the product
      if (product?.id) {
        await linkAssetsToProduct(admin, merchantId, product.id, group)
      }

      // Create an AI task record for this product creation
      await (admin.from("ai_tasks") as any).insert({
        merchant_id: merchantId,
        agent: "product",
        task_type: "bulk_product_create",
        status: "completed",
        input: { groupId: group.id, batchId },
        output: { productId: product?.id },
        metadata: {
          imageCount: allImages.length,
          category: group.category,
        },
      })

      createdCount++
    } catch (error) {
      console.error(`Error creating product for group ${group.id}:`, error)
    }
  }

  return createdCount
}

/**
 * Generate product details using AI
 */
async function generateProductDetails(group: ProductGroup): Promise<{
  name: string
  description: string
  suggestedSizes: string[]
  gender: "men" | "women" | "unisex"
}> {
  try {
    const prompt = `Generate product details for a streetwear item:

Product Name: ${group.name}
Category: ${group.category}
Number of images: ${group.images.length}

Generate:
1. A refined product name (2-4 words, streetwear-appropriate)
2. A compelling product description (2-3 sentences)
3. Suggested available sizes
4. Target gender (men, women, or unisex)

Return as JSON:
{
  "name": "Product Name",
  "description": "Product description",
  "suggestedSizes": ["S", "M", "L", "XL"],
  "gender": "unisex"
}

Return ONLY valid JSON.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 300,
    })

    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error("Error generating product details:", error)
  }

  // Fallback defaults
  return {
    name: group.name,
    description: `Premium ${group.category} from Brova's streetwear collection. Designed for style and comfort.`,
    suggestedSizes: ["S", "M", "L", "XL"],
    gender: "unisex",
  }
}

/**
 * Collect all images from a product group (original + processed)
 */
function collectAllImages(group: ProductGroup): string[] {
  const images = new Set<string>()

  // Add main image first
  images.add(group.mainImage)

  // Add original images
  group.images.forEach((img) => images.add(img))

  // Add processed images
  for (const processed of group.processedImages) {
    if (processed.background_removed) {
      images.add(processed.background_removed)
    }
    if (processed.lifestyle) {
      images.add(processed.lifestyle)
    }
    if (processed.model_shot) {
      images.add(processed.model_shot)
    }
  }

  return Array.from(images)
}

/**
 * Map category name to category ID
 */
function mapCategoryToId(categoryName: string): string {
  // Common category mappings
  const categoryMap: Record<string, string> = {
    "t-shirts": "t-shirts",
    "tshirts": "t-shirts",
    "shirts": "t-shirts",
    "hoodies": "hoodies",
    "sweaters": "hoodies",
    "pants": "pants",
    "jeans": "pants",
    "jackets": "jackets",
    "outerwear": "jackets",
    "accessories": "accessories",
    "hats": "accessories",
    "bags": "accessories",
    "shoes": "shoes",
    "footwear": "shoes",
  }

  const normalized = categoryName.toLowerCase().trim()
  return categoryMap[normalized] || normalized
}

/**
 * Link generated assets to the created product
 */
async function linkAssetsToProduct(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string,
  productId: string,
  group: ProductGroup
): Promise<void> {
  const imageUrls = new Set<string>()

  // Collect all processed image URLs
  for (const processed of group.processedImages) {
    if (processed.background_removed) {
      imageUrls.add(processed.background_removed)
    }
    if (processed.lifestyle) {
      imageUrls.add(processed.lifestyle)
    }
    if (processed.model_shot) {
      imageUrls.add(processed.model_shot)
    }
  }

  // Update assets with the product ID
  if (imageUrls.size > 0) {
    await admin
      .from("generated_assets")
      .update({ product_id: productId })
      .eq("merchant_id", merchantId)
      .in("generated_url", Array.from(imageUrls))
  }
}

/**
 * Suggest pricing based on category and similar products
 */
export async function suggestPricing(
  category: string,
  merchantId: string
): Promise<{ suggested: number; range: { min: number; max: number } } | null> {
  const admin = createAdminClient()

  // Get similar products for price comparison
  const { data: products } = await admin
    .from("products")
    .select("price")
    .eq("category_id", mapCategoryToId(category))
    .not("price", "is", null)
    .limit(20)

  if (!products || products.length === 0) {
    return null
  }

  const prices = products.map((p) => p.price).filter(Boolean) as number[]
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return {
    suggested: Math.round(avgPrice),
    range: { min: minPrice, max: maxPrice },
  }
}
