import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params
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

    // Verify batch exists and belongs to user
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .select("*, bulk_deal_images:bulk_deal_images(count)")
      .eq("id", batchId)
      .eq("merchant_id", user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found or access denied" },
        { status: 404 }
      )
    }

    // Check if batch is already being processed or completed
    if (batch.status !== 'pending') {
      return NextResponse.json(
        { error: `Batch is already ${batch.status}` },
        { status: 400 }
      )
    }

    // Get actual image count
    const { count: imageCount } = await supabase
      .from("bulk_deal_images")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)

    if (!imageCount || imageCount === 0) {
      return NextResponse.json(
        { error: "No images uploaded to batch" },
        { status: 400 }
      )
    }

    // Update batch status to analyzing (ready for AI processing)
    const { error: updateError } = await supabase
      .from("bulk_deal_batches")
      .update({ 
        status: 'analyzing',
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId)

    if (updateError) {
      console.error("Error updating batch status:", updateError)
      return NextResponse.json(
        { error: "Failed to finalize batch" },
        { status: 500 }
      )
    }

    // Get all image URLs for processing
    const { data: images } = await supabase
      .from("bulk_deal_images")
      .select("original_url")
      .eq("batch_id", batchId)
      .not("original_url", "is", null)

    const imageUrls = images?.map(img => img.original_url).filter(Boolean) as string[] || []

    return NextResponse.json({
      success: true,
      message: "Batch finalized and ready for processing",
      batchId,
      status: 'analyzing',
      imageUrls,
      imageCount: imageCount || 0,
    })
  } catch (error) {
    console.error("Error in finalize batch route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
