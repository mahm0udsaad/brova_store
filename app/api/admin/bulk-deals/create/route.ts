import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CreateBatchRequest {
  name: string
  totalImages: number
  shotConfig: {
    mode: 'single' | 'multi'
    shotCount?: number // 2-7 for multi mode
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateBatchRequest = await req.json()
    const { name, totalImages, shotConfig } = body

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Batch name is required" },
        { status: 400 }
      )
    }

    if (!totalImages || totalImages < 1) {
      return NextResponse.json(
        { error: "Total images must be at least 1" },
        { status: 400 }
      )
    }

    if (totalImages > 50) {
      return NextResponse.json(
        { error: "Maximum 50 images allowed per batch" },
        { status: 400 }
      )
    }

    if (!shotConfig || !shotConfig.mode) {
      return NextResponse.json(
        { error: "Shot configuration is required" },
        { status: 400 }
      )
    }

    if (shotConfig.mode === 'multi' && (!shotConfig.shotCount || shotConfig.shotCount < 2 || shotConfig.shotCount > 7)) {
      return NextResponse.json(
        { error: "Shot count must be between 2 and 7 for multi mode" },
        { status: 400 }
      )
    }

    // Check daily batch creation limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count, error: countError } = await supabase
      .from("bulk_deal_batches")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", user.id)
      .gte("created_at", today.toISOString())

    if (countError) {
      console.error("Error checking batch limit:", countError)
    } else if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: "Daily batch creation limit reached (5 batches per day)" },
        { status: 429 }
      )
    }

    // Determine operations based on shot mode
    const operations = shotConfig.mode === 'single' 
      ? ['remove_background']
      : ['remove_background', 'generate_lifestyle']

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .insert({
        merchant_id: user.id,
        name: name.trim(),
        status: 'pending',
        total_images: totalImages,
        processed_count: 0,
        failed_count: 0,
        source_urls: [],
        product_groups: [],
        config: {
          shotMode: shotConfig.mode,
          shotCount: shotConfig.shotCount || 1,
          operations,
        },
      })
      .select()
      .single()

    if (batchError || !batch) {
      console.error("Error creating batch:", batchError)
      return NextResponse.json(
        { error: "Failed to create batch" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      batch,
    })
  } catch (error) {
    console.error("Error in create batch route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
