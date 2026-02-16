import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Publish Store API
 *
 * Marks the store as active and onboarding as complete.
 * Only runs when the user explicitly confirms they want to publish.
 *
 * SAFETY:
 * - Requires authenticated user
 * - Verifies store ownership via organization join
 * - Only affects the specified store
 */

interface PublishRequest {
  storeId: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: PublishRequest = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }

    // Verify store ownership
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, organization_id, organizations!inner(owner_id)"
      )
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const orgData = Array.isArray(store.organizations)
      ? store.organizations[0]
      : store.organizations
    if ((orgData as any)?.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the store: set active + onboarding completed
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        status: "active",
        onboarding_completed: "completed",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)

    if (updateError) {
      console.error("[Publish] Error updating store:", updateError)
      return NextResponse.json(
        { error: "Failed to publish store" },
        { status: 500 }
      )
    }

    // Also update store_settings with completion metadata
    await supabase
      .from("store_settings")
      .upsert(
        {
          merchant_id: user.id,
          store_id: storeId,
          onboarding_status: "completed",
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "merchant_id" }
      )

    console.log(`[Publish] Store ${storeId} published by user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Store published successfully",
    })
  } catch (error) {
    console.error("[Publish API Error]:", error)
    return NextResponse.json(
      { error: "Failed to publish store" },
      { status: 500 }
    )
  }
}
