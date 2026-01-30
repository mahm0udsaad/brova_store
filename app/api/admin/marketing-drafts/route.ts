import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile check failed:", profileError)
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform")
    const status = searchParams.get("status") || "draft"
    const limit = parseInt(searchParams.get("limit") || "20")

    let query = supabase
      .from("marketing_post_drafts")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq("platform", platform)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch marketing drafts:", error)
      return NextResponse.json(
        { error: "Failed to fetch drafts" },
        { status: 500 }
      )
    }

    return NextResponse.json({ drafts: data })
  } catch (error) {
    console.error("Marketing drafts GET API error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile check failed:", profileError)
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const drafts = Array.isArray(body?.drafts) ? body.drafts : []

    if (drafts.length === 0) {
      return NextResponse.json(
        { error: "No drafts provided" },
        { status: 400 }
      )
    }

    const payload = drafts.map((draft: any) => ({
      merchant_id: user.id,
      platform: draft.platform,
      ui_structure: draft.uiStructure || draft.ui_structure || {},
      media_assets: draft.mediaAssets || draft.media_assets || {},
      copy_text: draft.copyText || draft.copy_text || {},
      status: draft.status || "draft",
      version: draft.version || 1,
    }))

    const { data, error } = await supabase
      .from("marketing_post_drafts")
      .insert(payload)
      .select("id, platform, status, created_at")

    if (error) {
      console.error("Failed to insert marketing drafts:", error)
      return NextResponse.json(
        { error: "Failed to save drafts" },
        { status: 500 }
      )
    }

    return NextResponse.json({ drafts: data })
  } catch (error) {
    console.error("Marketing drafts API error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    )
  }
}
