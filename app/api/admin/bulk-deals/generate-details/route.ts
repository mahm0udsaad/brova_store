import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"

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
    const { group } = body

    if (!group) {
      return NextResponse.json(
        { error: "Product group is required" },
        { status: 400 }
      )
    }

    // Generate product details using AI
    const prompt = `Generate product details for a streetwear item:

Product Name: ${group.name}
Category: ${group.category}
Number of images: ${group.images?.length || 0}

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

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const details = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        ...details,
      })
    }

    // Fallback defaults
    return NextResponse.json({
      success: true,
      name: group.name,
      description: `Premium ${group.category} from the streetwear collection. Designed for style and comfort.`,
      suggestedSizes: ["S", "M", "L", "XL"],
      gender: "unisex",
    })
  } catch (error) {
    console.error("Details generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate product details" },
      { status: 500 }
    )
  }
}
