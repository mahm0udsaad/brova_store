"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { revalidatePath } from "next/cache"

export interface BannerInput {
  image_url: string
  title?: string
  title_ar?: string
  link_url?: string
  link_type?: 'none' | 'product' | 'category' | 'external'
  link_target?: string
  position?: 'hero' | 'top' | 'middle' | 'bottom'
  is_active?: boolean
  starts_at?: string
  ends_at?: string
}

export async function getBanners() {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return []

  const { data, error } = await supabase
    .from('store_banners')
    .select('*')
    .eq('store_id', context.store.id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[getBanners] Error:', error)
    return []
  }

  return data || []
}

export async function createBanner(input: BannerInput) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: existing } = await supabase
    .from('store_banners')
    .select('sort_order')
    .eq('store_id', context.store.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sort_order = (existing?.[0]?.sort_order || 0) + 1

  const { data, error } = await supabase
    .from('store_banners')
    .insert({
      store_id: context.store.id,
      ...input,
      sort_order,
    })
    .select()
    .single()

  if (error) {
    console.error('[createBanner] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/appearance')
  return { success: true, banner: data }
}

export async function updateBanner(bannerId: string, input: Partial<BannerInput>) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('store_banners')
    .update(input)
    .eq('id', bannerId)
    .eq('store_id', context.store.id)
    .select()
    .single()

  if (error) {
    console.error('[updateBanner] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/appearance')
  return { success: true, banner: data }
}

export async function deleteBanner(bannerId: string) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('store_banners')
    .delete()
    .eq('id', bannerId)
    .eq('store_id', context.store.id)

  if (error) {
    console.error('[deleteBanner] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/appearance')
  return { success: true }
}

export async function reorderBanners(bannerIds: string[]) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  for (let i = 0; i < bannerIds.length; i++) {
    await supabase
      .from('store_banners')
      .update({ sort_order: i })
      .eq('id', bannerIds[i])
      .eq('store_id', context.store.id)
  }

  revalidatePath('/admin/appearance')
  return { success: true }
}
