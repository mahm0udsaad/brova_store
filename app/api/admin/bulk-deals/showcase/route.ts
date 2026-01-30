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
    const { imageUrl, count, style } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      )
    }

    // Initialize photographer agent
    const photographerAgent = new PhotographerAgent(user.id)

    // Generate showcase images
    const result = await photographerAgent.execute("generate_showcase", {
      imageUrl,
      count: count || 4,
      style: style || "clean",
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate showcase" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: result.data?.images || [],
      count: result.data?.count || 0,
      message: result.message,
    })
  } catch (error) {
    console.error("Showcase generation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
