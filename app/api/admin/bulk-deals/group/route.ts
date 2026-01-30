import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { groupImagesByVisualSimilarity } from "@/lib/bulk-processing/image-grouper"

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
    const { imageUrls } = body

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Image URLs are required" },
        { status: 400 }
      )
    }

    // Group images by visual similarity
    const groups = await groupImagesByVisualSimilarity(imageUrls)

    return NextResponse.json({
      success: true,
      groups,
      count: groups.length,
    })
  } catch (error) {
    console.error("Grouping error:", error)
    return NextResponse.json(
      { error: "Failed to group images" },
      { status: 500 }
    )
  }
}
