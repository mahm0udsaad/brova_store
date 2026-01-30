import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processBulkBatch } from "@/lib/bulk-processing/processor"

// POST - Start processing a bulk batch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { batchId } = body

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      )
    }

    // Get the batch
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .select("*")
      .eq("id", batchId)
      .eq("merchant_id", user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      )
    }

    if (batch.status !== "pending" && batch.status !== "paused") {
      return NextResponse.json(
        { error: `Cannot process batch with status: ${batch.status}` },
        { status: 400 }
      )
    }

    // Update status to analyzing
    await supabase
      .from("bulk_deal_batches")
      .update({ status: "analyzing", started_at: new Date().toISOString() })
      .eq("id", batchId)

    // Start processing in background (don't await)
    processBulkBatch(batchId, user.id).catch((err) => {
      console.error("Bulk processing error:", err)
      // Update batch status to failed
      supabase
        .from("bulk_deal_batches")
        .update({
          status: "failed",
          error_log: [{ error: err.message, timestamp: new Date().toISOString() }],
        })
        .eq("id", batchId)
    })

    return NextResponse.json({
      success: true,
      message: "Processing started",
      batchId,
    })
  } catch (error) {
    console.error("Start processing error:", error)
    return NextResponse.json(
      { error: "Failed to start processing" },
      { status: 500 }
    )
  }
}
