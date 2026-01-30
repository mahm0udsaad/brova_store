import { createClient as createBrowserClient } from "@/lib/supabase/client"

/**
 * Client-side admin check
 * Checks if the current user is an admin by querying the admins table
 */
export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data, error } = await supabase.from("admins").select("id").eq("id", user.id).single()

    if (error) {
      // Not an admin or error occurred
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in isAdminClient check:", error)
    return false
  }
}
