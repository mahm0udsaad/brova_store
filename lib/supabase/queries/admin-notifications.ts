/**
 * Admin Notification Queries
 *
 * Notifications scoped to the authenticated user's store.
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export interface Notification {
  id: string
  type: 'order' | 'low_stock' | 'payout' | 'system'
  title: string
  title_ar: string | null
  message: string | null
  message_ar: string | null
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
}

export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}): Promise<{ notifications: Notification[]; total: number }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { notifications: [], total: 0 }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('store_id', context.store.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[getNotifications] Error:', error)
    return { notifications: [], total: 0 }
  }

  return { notifications: (data || []) as Notification[], total: count || 0 }
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', context.store.id)
    .eq('is_read', false)

  if (error) return 0
  return count || 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('store_id', context.store.id)
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('store_id', context.store.id)
    .eq('is_read', false)
}
