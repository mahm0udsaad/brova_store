import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List generated assets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get("type")
    const productId = searchParams.get("productId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("generated_assets")
      .select("*", { count: "exact" })
      .eq("merchant_id", user.id)

    if (assetType) {
      query = query.eq("asset_type", assetType)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      assets: data,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Get generated assets error:", error)
    return NextResponse.json(
      { error: "Failed to fetch generated assets" },
      { status: 500 }
    )
  }
}

// DELETE - Delete generated assets
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs are required" },
        { status: 400 }
      )
    }

    // Delete assets (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from("generated_assets")
      .delete()
      .in("id", assetIds)
      .eq("merchant_id", user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      deletedCount: assetIds.length,
    })
  } catch (error) {
    console.error("Delete generated assets error:", error)
    return NextResponse.json(
      { error: "Failed to delete assets" },
      { status: 500 }
    )
  }
}
