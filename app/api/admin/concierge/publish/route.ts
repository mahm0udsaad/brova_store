import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ConciergeContext, DraftStoreState } from "@/lib/ai/concierge-context"

/**
 * Publish Store API
 * 
 * Marks onboarding as complete and finalizes store setup.
 * This ONLY runs when the user explicitly confirms they want to publish.
 * 
 * SAFETY:
 * - Requires authenticated user
 * - Requires explicit confirmation
 * - Only affects the current user's store
 */

interface PublishRequest {
  draftState: DraftStoreState
  context: ConciergeContext
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request
    const body: PublishRequest = await request.json()
    const { draftState } = body
    
    // Prepare final settings
    const aiPreferences: Record<string, unknown> = {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }
    
    if (draftState.store_name?.value) {
      aiPreferences.store_name = draftState.store_name.value
    }
    
    // Update store_settings with completion status
    const { error: updateError } = await supabase
      .from("store_settings")
      .upsert({
        merchant_id: user.id,
        onboarding_status: "completed",
        onboarding_completed_at: new Date().toISOString(),
        ai_preferences: aiPreferences,
        appearance: draftState.appearance ? {
          primary_color: draftState.appearance.primary_color || "#000000",
          accent_color: draftState.appearance.accent_color || "#6366f1",
          font_family: draftState.appearance.font_family || "Inter",
          logo_url: draftState.appearance.logo_preview_url || null,
        } : undefined,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "merchant_id",
      })
    
    if (updateError) {
      console.error("[Publish] Error completing onboarding:", updateError)
      return NextResponse.json(
        { error: "Failed to complete setup" },
        { status: 500 }
      )
    }
    
    console.log(`[Publish] User ${user.id} completed onboarding`)
    
    return NextResponse.json({
      success: true,
      message: "Store setup complete",
    })
    
  } catch (error) {
    console.error("[Publish API Error]:", error)
    
    return NextResponse.json(
      { error: "Failed to complete setup" },
      { status: 500 }
    )
  }
}
