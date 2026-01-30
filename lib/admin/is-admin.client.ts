import { createClient as createBrowserClient } from "@/lib/supabase/client"

/**
 * Client-side admin check
 * Checks if the current user is an admin by querying the profiles table
 */
export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[isAdminClient] Checking admin status for user:", user?.id)

    if (!user) {
      console.log("[isAdminClient] No user found")
      return false
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("[isAdminClient] Error querying profile:", error)
      return false
    }

    console.log("[isAdminClient] Profile data:", data)
    console.log("[isAdminClient] Is admin?", data?.is_admin === true)

    return data?.is_admin === true
  } catch (error) {
    console.error("[isAdminClient] Exception:", error)
    return false
  }
}
