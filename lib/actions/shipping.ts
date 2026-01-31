"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { revalidatePath } from "next/cache"

export interface ShippingSettings {
  flat_rate_enabled: boolean
  flat_rate_amount: number
  free_shipping_threshold: number | null
  shipping_zones: string[]
}

const defaultSettings: ShippingSettings = {
  flat_rate_enabled: true,
  flat_rate_amount: 5000,
  free_shipping_threshold: null,
  shipping_zones: ['EG'],
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return defaultSettings
  }

  const { data } = await supabase
    .from('store_settings')
    .select('shipping_settings')
    .eq('store_id', context.store.id)
    .single()

  return data?.shipping_settings || defaultSettings
}

export async function updateShippingSettings(settings: ShippingSettings): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('store_settings')
    .update({ shipping_settings: settings })
    .eq('store_id', context.store.id)

  if (error) {
    console.error('[updateShippingSettings] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings/shipping')
  return { success: true }
}
