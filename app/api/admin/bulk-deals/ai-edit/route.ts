import { createClient } from "@/lib/supabase/server"
import { PhotographerAgent } from "@/lib/agents/photographer-agent"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, action } = body

    if (!imageUrl || !action) {
      return NextResponse.json(
        { error: "Image URL and action are required" },
        { status: 400 }
      )
    }

    // Initialize photographer agent
    const photographerAgent = new PhotographerAgent(user.id)

    let result

    // Map UI actions to agent actions
    switch (action) {
      case "remove_bg":
        result = await photographerAgent.execute("remove_background", { imageUrl })
        break
      case "lifestyle":
        result = await photographerAgent.execute("generate_lifestyle", {
          productImageUrl: imageUrl,
        })
        break
      case "enhance":
        result = await photographerAgent.execute("generate_image", {
          prompt: "Enhance product image with better lighting and quality, professional photography",
          sourceImages: [imageUrl],
          style: "clean",
        })
        break
      case "regenerate":
        result = await photographerAgent.execute("generate_image", {
          prompt: "Product photography with clean background and professional lighting",
          sourceImages: [imageUrl],
          style: "studio",
        })
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process image" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.data?.imageUrl || result.data?.asset?.generated_url,
      asset: result.data?.asset,
      message: result.message,
    })
  } catch (error) {
    console.error("AI edit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
