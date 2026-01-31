import { generateObject } from "ai"
import { z } from "zod"
import { models } from "@/lib/ai/gateway"

const BannerSuggestionSchema = z.object({
  title: z.string(),
  title_ar: z.string(),
  subtitle: z.string(),
  subtitle_ar: z.string(),
  cta_text: z.string(),
  cta_text_ar: z.string(),
  style_suggestion: z.string(),
})

export async function generateBannerContent(input: {
  store_name: string
  store_type: 'clothing' | 'car_care'
  products?: { name: string; category: string }[]
  occasion?: string
}) {
  try {
    const { object } = await generateObject({
      model: models.flash,
      schema: BannerSuggestionSchema,
      prompt: `Generate promotional banner content for an e-commerce store.

Store: ${input.store_name}
Type: ${input.store_type}
${input.products ? `Featured products: ${input.products.map(p => p.name).join(', ')}` : ''}
${input.occasion ? `Occasion: ${input.occasion}` : ''}

Generate compelling bilingual (English and Arabic) banner content:
- title: Catchy headline (max 6 words)
- title_ar: Arabic version
- subtitle: Supporting text (max 12 words)
- subtitle_ar: Arabic version
- cta_text: Button text (e.g., "Shop Now")
- cta_text_ar: Arabic button text
- style_suggestion: Brief description of visual style to use`,
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error('[generateBannerContent] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate banner',
    }
  }
}
