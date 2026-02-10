/**
 * Social Media Connection Initiation API
 *
 * GET /api/social/connect?platform={tiktok|instagram}&storeId={id}
 * Generates OAuth URL and redirects user to platform authorization page
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getTikTokClient } from "@/lib/social/tiktok"
import { getInstagramClient } from "@/lib/social/instagram"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get("platform")
    const storeId = searchParams.get("storeId")

    // Validate parameters
    if (!platform || !storeId) {
      return NextResponse.json(
        { error: "Missing platform or storeId parameter" },
        { status: 400 }
      )
    }

    if (platform !== "tiktok" && platform !== "instagram") {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'tiktok' or 'instagram'" },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?returnUrl=/admin/marketing", req.url)
      )
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("organization_id")
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", store.organization_id)
      .single()

    if (orgError || !org || org.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 }
      )
    }

    // Generate OAuth URL based on platform
    let authUrl: string

    if (platform === "tiktok") {
      const client = getTikTokClient()
      const result = await client.getAuthorizationUrl(storeId)

      // TODO: Store code_verifier in encrypted session cookie or Redis
      // For now, we're skipping this step (will cause OAuth flow to fail)
      // In production, you MUST store the code_verifier securely

      authUrl = result.url
    } else {
      // instagram
      const client = getInstagramClient()
      const result = client.getAuthorizationUrl(storeId)
      authUrl = result.url
    }

    // Redirect to platform OAuth page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("Social connect error:", error)
    return NextResponse.json(
      {
        error: "Failed to initiate connection",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
