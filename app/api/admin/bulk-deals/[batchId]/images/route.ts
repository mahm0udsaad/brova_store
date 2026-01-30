import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface AddImageRequest {
  storageId: string
  fileName: string
  originalUrl?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
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

    const { batchId } = await params

    // Verify batch exists and belongs to user
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .select("id, merchant_id, status, source_urls, total_images")
      .eq("id", batchId)
      .eq("merchant_id", user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found or access denied" },
        { status: 404 }
      )
    }

    // Parse request body
    const body: AddImageRequest = await req.json()
    const { storageId, fileName, originalUrl } = body

    if (!storageId || !fileName) {
      return NextResponse.json(
        { error: "Storage ID and file name are required" },
        { status: 400 }
      )
    }

    // Check if we've already reached the total images limit
    const { count: existingCount } = await supabase
      .from("bulk_deal_images")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)

    if (existingCount !== null && existingCount >= batch.total_images) {
      return NextResponse.json(
        { error: "Batch image limit reached" },
        { status: 400 }
      )
    }

    // Add image record
    const { data: image, error: imageError } = await supabase
      .from("bulk_deal_images")
      .insert({
        batch_id: batchId,
        storage_id: storageId,
        file_name: fileName,
        original_url: originalUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (imageError || !image) {
      console.error("Error adding image:", imageError)
      return NextResponse.json(
        { error: "Failed to add image" },
        { status: 500 }
      )
    }

    // Update batch source_urls array
    const updatedSourceUrls = originalUrl 
      ? [...(batch.source_urls || []), originalUrl]
      : batch.source_urls

    await supabase
      .from("bulk_deal_batches")
      .update({ source_urls: updatedSourceUrls })
      .eq("id", batchId)

    return NextResponse.json({
      success: true,
      image,
    })
  } catch (error) {
    console.error("Error in add image route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
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

    const { batchId } = await params

    // Verify batch belongs to user
    const { data: batch, error: batchError } = await supabase
      .from("bulk_deal_batches")
      .select("id, merchant_id")
      .eq("id", batchId)
      .eq("merchant_id", user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found or access denied" },
        { status: 404 }
      )
    }

    // Get all images for this batch
    const { data: images, error: imagesError } = await supabase
      .from("bulk_deal_images")
      .select("*")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true })

    if (imagesError) {
      console.error("Error fetching images:", imagesError)
      return NextResponse.json(
        { error: "Failed to fetch images" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: images || [],
    })
  } catch (error) {
    console.error("Error in get images route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
