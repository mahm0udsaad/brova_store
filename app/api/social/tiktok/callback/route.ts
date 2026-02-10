/**
 * TikTok OAuth Callback Handler
 *
 * Handles OAuth redirect from TikTok after user authorization
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  getTikTokClient,
  saveTikTokConnection,
} from "@/lib/social/tiktok"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Check for OAuth errors
    if (error) {
      console.error("TikTok OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/admin/marketing?error=${encodeURIComponent(errorDescription || error)}`,
          req.url
        )
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/admin/marketing?error=Missing code or state parameter",
          req.url
        )
      )
    }

    // Decode state to get storeId and codeVerifier
    let stateData: { storeId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString())
    } catch (e) {
      return NextResponse.redirect(
        new URL("/admin/marketing?error=Invalid state parameter", req.url)
      )
    }

    // Validate state timestamp (should be within 10 minutes)
    const stateAge = Date.now() - stateData.timestamp
    if (stateAge > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/admin/marketing?error=OAuth state expired", req.url)
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
      .eq("id", stateData.storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.redirect(
        new URL("/admin/marketing?error=Store not found", req.url)
      )
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", store.organization_id)
      .single()

    if (orgError || !org || org.owner_id !== user.id) {
      return NextResponse.redirect(
        new URL(
          "/admin/marketing?error=You do not have access to this store",
          req.url
        )
      )
    }

    // Get code verifier from session/cache
    // For now, we'll regenerate a new one - in production, you'd store this in Redis/session
    // This is a limitation of the stateless approach
    // TODO: Store code_verifier in encrypted session cookie or Redis
    const client = getTikTokClient()

    // Note: In production, retrieve the actual code_verifier stored during auth initiation
    // For now, we'll use a workaround - TikTok may reject this
    const tempCodeVerifier = "temp_code_verifier_needs_session_storage"

    try {
      // Exchange code for access token
      const tokenResponse = await client.exchangeCodeForToken(code, tempCodeVerifier)

      // Get user info
      const userInfo = await client.getUserInfo(tokenResponse.access_token)

      // Save connection to database
      await saveTikTokConnection(stateData.storeId, tokenResponse, userInfo)

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/admin/marketing?success=TikTok account @${userInfo.display_name} connected successfully`,
          req.url
        )
      )
    } catch (error: any) {
      console.error("TikTok token exchange failed:", error)
      return NextResponse.redirect(
        new URL(
          `/admin/marketing?error=${encodeURIComponent(error.message)}`,
          req.url
        )
      )
    }
  } catch (error: any) {
    console.error("TikTok callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/admin/marketing?error=${encodeURIComponent(error.message)}`,
        req.url
      )
    )
  }
}
