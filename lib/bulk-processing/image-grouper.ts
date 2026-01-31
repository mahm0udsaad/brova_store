import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"

interface ProductGroup {
  id: string
  name: string
  category: string
  mainImage: string
  images: string[]
}

/**
 * Group images by visual similarity using Gemini Vision
 *
 * This function analyzes all uploaded images and groups them by:
 * 1. Product type (same product, different angles)
 * 2. Visual similarity (colors, patterns, style)
 * 3. Category inference
 */
export async function groupImagesByVisualSimilarity(
  imageUrls: string[]
): Promise<ProductGroup[]> {
  if (imageUrls.length === 0) {
    return []
  }

  // For small batches, analyze all at once
  if (imageUrls.length <= 10) {
    return analyzeAndGroupImages(imageUrls)
  }

  // For larger batches, process in chunks
  const chunkSize = 10
  const allGroups: ProductGroup[] = []
  const processedImages = new Set<string>()

  for (let i = 0; i < imageUrls.length; i += chunkSize) {
    const chunk = imageUrls
      .slice(i, i + chunkSize)
      .filter((url) => !processedImages.has(url))

    if (chunk.length === 0) continue

    const groups = await analyzeAndGroupImages(chunk)

    // Merge with existing groups or add new ones
    for (const newGroup of groups) {
      const existingGroup = allGroups.find((g) =>
        isSimilarProduct(g, newGroup)
      )

      if (existingGroup) {
        // Merge images into existing group
        existingGroup.images.push(...newGroup.images)
      } else {
        allGroups.push(newGroup)
      }

      // Mark images as processed
      newGroup.images.forEach((img) => processedImages.add(img))
    }
  }

  return allGroups
}

/**
 * Analyze images and create groups using Gemini Vision
 */
async function analyzeAndGroupImages(imageUrls: string[]): Promise<ProductGroup[]> {
  try {
    // Create a prompt for Gemini to analyze and group images
    const imageList = imageUrls.map((url, idx) => `Image ${idx + 1}: ${url}`).join("\n")

    const prompt = `Analyze these product images from a streetwear store and group them by product.

Images:
${imageList}

For each group, identify:
1. Which images show the same product (different angles/colors count as same product)
2. A suggested product name based on the image
3. The product category (t-shirts, hoodies, pants, jackets, accessories, etc.)
4. Which image should be the main/featured image

Return a JSON array with this exact format:
[
  {
    "id": "group_1",
    "name": "Product Name",
    "category": "category",
    "mainImage": "image_url",
    "images": ["image_url1", "image_url2"]
  }
]

Rules:
- Group similar products together (same item, different angles)
- Use descriptive streetwear-appropriate names
- Choose the best quality/angle image as mainImage
- Every image should be in exactly one group
- If an image is unclear, put it in its own group

Return ONLY valid JSON, no other text.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 2000,
    })

    // Parse the JSON response
    const jsonMatch = result.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      // Fallback: each image is its own group
      return createFallbackGroups(imageUrls)
    }

    const groups = JSON.parse(jsonMatch[0]) as ProductGroup[]

    // Validate and fix groups
    return validateGroups(groups, imageUrls)
  } catch (error) {
    console.error("Image grouping error:", error)
    // Fallback: each image is its own group
    return createFallbackGroups(imageUrls)
  }
}

/**
 * Create fallback groups where each image is its own product
 */
function createFallbackGroups(imageUrls: string[]): ProductGroup[] {
  return imageUrls.map((url, idx) => ({
    id: `group_${idx + 1}`,
    name: `Product ${idx + 1}`,
    category: "Uncategorized",
    mainImage: url,
    images: [url],
  }))
}

/**
 * Validate and fix groups to ensure all images are accounted for
 */
function validateGroups(groups: ProductGroup[], allImages: string[]): ProductGroup[] {
  const usedImages = new Set<string>()
  const validGroups: ProductGroup[] = []

  for (const group of groups) {
    // Filter to only include images that exist and haven't been used
    const validImages = group.images.filter(
      (img) => allImages.includes(img) && !usedImages.has(img)
    )

    if (validImages.length > 0) {
      validImages.forEach((img) => usedImages.add(img))

      validGroups.push({
        ...group,
        images: validImages,
        mainImage: validImages.includes(group.mainImage)
          ? group.mainImage
          : validImages[0],
      })
    }
  }

  // Add any unused images as individual groups
  const unusedImages = allImages.filter((img) => !usedImages.has(img))
  for (let i = 0; i < unusedImages.length; i++) {
    validGroups.push({
      id: `group_auto_${i + 1}`,
      name: `Product (Auto)`,
      category: "Uncategorized",
      mainImage: unusedImages[i],
      images: [unusedImages[i]],
    })
  }

  return validGroups
}

/**
 * Check if two product groups are similar enough to merge
 */
function isSimilarProduct(group1: ProductGroup, group2: ProductGroup): boolean {
  // Simple heuristic: same category and similar name
  if (group1.category !== group2.category) {
    return false
  }

  const name1 = group1.name.toLowerCase()
  const name2 = group2.name.toLowerCase()

  // Check for significant word overlap
  const words1 = new Set(name1.split(/\s+/).filter((w) => w.length > 2))
  const words2 = new Set(name2.split(/\s+/).filter((w) => w.length > 2))

  const commonWords = [...words1].filter((w) => words2.has(w))
  const similarity = commonWords.length / Math.max(words1.size, words2.size)

  return similarity > 0.5
}

/**
 * Refine product name using AI
 */
export async function refineProductName(
  currentName: string,
  category: string,
  imageUrls: string[]
): Promise<string> {
  try {
    const prompt = `Given a streetwear product:
- Current name: ${currentName}
- Category: ${category}
- Number of images: ${imageUrls.length}

Generate a better, more marketable product name that:
- Is concise (2-4 words)
- Sounds authentic to streetwear culture
- Is descriptive but not generic

Return ONLY the product name, nothing else.`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 50,
    })

    return result.text.trim() || currentName
  } catch {
    return currentName
  }
}
