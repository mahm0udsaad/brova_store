import { generateText } from "ai"
import { getGatewayModel } from "@/lib/ai/config"
import { createClient } from "@/lib/supabase/server"

export async function generateStoreImage(
  prompt: string,
  options: {
    storeId: string
    style?: "banner" | "hero" | "lifestyle" | "product_photo" | "minimal"
    aspect_ratio?: "16:9" | "4:3" | "1:1"
  }
): Promise<{ url: string } | { error: string }> {
  const { storeId, style = "banner", aspect_ratio = "16:9" } = options

  const stylePrompts: Record<string, string> = {
    banner: "E-commerce promotional banner, clean modern design, high quality product photography style",
    hero: "Hero section image, wide format, bold and eye-catching, premium brand feel",
    lifestyle: "Lifestyle product photography, natural lighting, aspirational setting",
    product_photo: "Product photography on clean background, professional studio lighting",
    minimal: "Minimalist design, clean geometry, subtle gradient background",
  }

  const fullPrompt = `${prompt}. ${stylePrompts[style]}. Aspect ratio: ${aspect_ratio}. No text or watermarks.`

  try {
    const result = await generateText({
      model: getGatewayModel("gemini-2.5-flash-image"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: fullPrompt,
            },
          ],
        },
      ],
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
    })

    // Extract image from response parts
    const allParts = (result.response?.messages ?? []).flatMap((m: any) =>
      Array.isArray(m.content) ? m.content : []
    )
    const imagePart = allParts.find(
      (p: any) => p.type === "image" || p.type === "file"
    )

    if (!imagePart) {
      return { error: "No image generated" }
    }

    // Get base64 data
    const imageData = (imagePart as any).image || (imagePart as any).data
    if (!imageData) {
      return { error: "No image data in response" }
    }

    // Upload to Supabase Storage (use "uploads" bucket — already exists with public access)
    const supabase = await createClient()
    const fileName = `generated/${storeId}/${Date.now()}.png`
    const buffer = Buffer.from(imageData, "base64")

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(fileName)

    return { url: publicUrl }
  } catch (error) {
    console.error("[generateStoreImage] Error:", error)
    return {
      error: error instanceof Error ? error.message : "Image generation failed",
    }
  }
}
