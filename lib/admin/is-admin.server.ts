import "server-only"

import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

/**
 * Server-side admin check
 * Checks if a user is an admin by querying the profiles table
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data?.is_admin === true
  } catch (error) {
    console.error("Error in isAdmin check:", error)
    return false
  }
}
