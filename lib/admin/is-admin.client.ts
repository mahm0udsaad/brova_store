import { createClient as createBrowserClient } from "@/lib/supabase/client"

/**
 * Client-side admin check
 * A user is an admin if they own an organization OR have is_admin flag in profiles.
 */
export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Check if user owns an organization (multi-tenant admin)
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle()

    if (org) {
      return true
    }

    // Fallback: check legacy is_admin flag on profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    return profile?.is_admin === true
  } catch (error) {
    console.error("[isAdminClient] Exception:", error)
    return false
  }
}
