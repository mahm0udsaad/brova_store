/**
 * Notifications Queries
 * Query notifications table
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export async function getNotifications(options?: { unreadOnly?: boolean }) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return []

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("store_id", context.store.id)
    .order("created_at", { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query

  if (error) {
    console.error("[getNotifications] Error:", error)
    return []
  }

  return data || []
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return 0

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("store_id", context.store.id)
    .eq("is_read", false)

  if (error) {
    console.error("[getUnreadCount] Error:", error)
    return 0
  }

  return count || 0
}
