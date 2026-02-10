"use server"

import { createClient } from '@/lib/supabase/server'
import { getAdminStoreContext } from '@/lib/supabase/queries/admin-store'

type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string }

export type VariantInput = {
  product_id: string
  options: Record<string, string>
  sku?: string
  price?: number
  compare_at_price?: number | null
  inventory_quantity?: number
  inventory_policy?: 'deny' | 'continue'
  weight?: number | null
  weight_unit?: 'kg' | 'g' | 'lb' | 'oz'
  image_url?: string | null
  available?: boolean
}

export async function getVariants(productId: string) {
  const context = await getAdminStoreContext()
  if (!context) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('store_id', context.store.id)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function createVariant(input: VariantInput): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      ...input,
      store_id: context.store.id,
    } as any)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateVariant(
  variantId: string,
  updates: Partial<Omit<VariantInput, 'product_id'>>
): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('product_variants')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', variantId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteVariant(variantId: string): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateVariantStock(
  variantId: string,
  quantity: number
): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('product_variants')
    .update({
      inventory_quantity: quantity,
      available: quantity > 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', variantId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
