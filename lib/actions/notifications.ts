"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { revalidatePath } from "next/cache"

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('store_id', context.store.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/notifications')
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('store_id', context.store.id)
    .eq('is_read', false)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/notifications')
  return { success: true }
}

export async function createNotification(input: {
  store_id: string
  type: 'order' | 'low_stock' | 'payout' | 'system'
  title: string
  title_ar?: string
  message?: string
  message_ar?: string
  data?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .insert(input)

  if (error) {
    console.error('[createNotification] Error:', error)
  }
}
