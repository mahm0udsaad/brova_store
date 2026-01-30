import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List bulk deal batches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "20")

    let query = supabase
      .from("bulk_deal_batches")
      .select("*")
      .eq("merchant_id", user.id)

    if (status) {
      query = query.eq("status", status)
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ batches: data })
  } catch (error) {
    console.error("Get bulk batches error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bulk batches" },
      { status: 500 }
    )
  }
}

// POST - Create a new bulk batch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, sourceUrls, config } = body

    if (!sourceUrls || !Array.isArray(sourceUrls) || sourceUrls.length === 0) {
      return NextResponse.json(
        { error: "Source URLs are required" },
        { status: 400 }
      )
    }

    // Parallelize count and settings fetch
    const today = new Date().toISOString().split("T")[0]
    const [
      { count },
      { data: settings }
    ] = await Promise.all([
      supabase
        .from("bulk_deal_batches")
        .select("id", { count: "exact", head: true })
        .eq("merchant_id", user.id)
        .gte("created_at", `${today}T00:00:00`),
      supabase
        .from("store_settings")
        .select("ai_preferences")
        .eq("merchant_id", user.id)
        .single()
    ])

    const dailyLimit = settings?.ai_preferences?.daily_limits?.bulk_batches || 5

    if ((count || 0) >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily limit of ${dailyLimit} batches reached` },
        { status: 429 }
      )
    }

    const { data, error } = await supabase
      .from("bulk_deal_batches")
      .insert({
        merchant_id: user.id,
        name: name || `Batch ${new Date().toLocaleString()}`,
        status: "pending",
        source_urls: sourceUrls,
        total_images: sourceUrls.length,
        config: config || {
          generate_lifestyle: true,
          remove_background: true,
          create_products: true,
        },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ batch: data })
  } catch (error) {
    console.error("Create bulk batch error:", error)
    return NextResponse.json(
      { error: "Failed to create bulk batch" },
      { status: 500 }
    )
  }
}
