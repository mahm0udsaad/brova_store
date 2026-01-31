import { generateObject } from "ai"
import { z } from "zod"
import { models } from "@/lib/ai/gateway"

const ColorPaletteSchema = z.object({
  name: z.string(),
  name_ar: z.string(),
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

const ColorAnalysisSchema = z.object({
  dominant_colors: z.array(z.string()),
  suggested_palettes: z.array(ColorPaletteSchema),
})

export async function extractColorsFromLogo(imageUrl: string) {
  try {
    const { object } = await generateObject({
      model: models.vision,
      schema: ColorAnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageUrl,
            },
            {
              type: 'text',
              text: `Analyze this logo image and extract colors.

Return:
1. dominant_colors: Array of 3-5 hex colors found in the logo
2. suggested_palettes: 3 color palette suggestions for an e-commerce store based on this logo

Each palette should have:
- name: English name (e.g., "Modern Minimalist")
- name_ar: Arabic name
- primary: Main brand color (from logo)
- secondary: Complementary color
- accent: Highlight/CTA color
- background: Background color (#ffffff or light shade)
- text: Text color (#000000 or dark shade)

Make the palettes diverse:
1. One based directly on logo colors
2. One with complementary colors
3. One modern/trendy variation`,
            },
          ],
        },
      ],
    })

    return {
      success: true,
      data: object,
    }
  } catch (error) {
    console.error('[extractColorsFromLogo] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze logo',
    }
  }
}
