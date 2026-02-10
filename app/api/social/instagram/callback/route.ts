/**
 * Instagram OAuth Callback Handler
 *
 * Handles OAuth redirect from Facebook/Instagram after user authorization
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  getInstagramClient,
  saveInstagramConnection,
} from "@/lib/social/instagram"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Check for OAuth errors
    if (error) {
      console.error("Instagram OAuth error:", error, errorDescription)
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

    // Decode state to get storeId
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

    const client = getInstagramClient()

    try {
      // Step 1: Exchange code for short-lived token
      const shortLivedToken = await client.exchangeCodeForToken(code)

      // Step 2: Exchange short-lived token for long-lived token (60 days)
      const longLivedToken = await client.getLongLivedToken(
        shortLivedToken.access_token
      )

      // Step 3: Get Instagram Business Account ID
      const igAccountId = await client.getInstagramAccountId(
        longLivedToken.access_token
      )

      // Step 4: Get account info
      const accountInfo = await client.getAccountInfo(
        igAccountId,
        longLivedToken.access_token
      )

      // Step 5: Save connection to database
      await saveInstagramConnection(stateData.storeId, longLivedToken, accountInfo)

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/admin/marketing?success=Instagram account @${accountInfo.username} connected successfully`,
          req.url
        )
      )
    } catch (error: any) {
      console.error("Instagram token exchange failed:", error)

      // Handle specific error cases
      let errorMessage = error.message

      if (error.message.includes("No Facebook Pages found")) {
        errorMessage =
          "Please connect your Instagram Business account to a Facebook Page first."
      } else if (error.message.includes("No Instagram Business Account")) {
        errorMessage =
          "Please convert your Instagram account to a Business or Creator account."
      }

      return NextResponse.redirect(
        new URL(
          `/admin/marketing?error=${encodeURIComponent(errorMessage)}`,
          req.url
        )
      )
    }
  } catch (error: any) {
    console.error("Instagram callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/admin/marketing?error=${encodeURIComponent(error.message)}`,
        req.url
      )
    )
  }
}
