/**
 * Admin Category Queries
 *
 * CRUD for store_categories with tenant isolation.
 */

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export interface StoreCategory {
  id: string
  store_id: string
  name: string
  name_ar: string | null
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CategoryFormData {
  name: string
  name_ar?: string | null
  slug?: string
  parent_id?: string | null
  image_url?: string | null
  sort_order?: number
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * List all categories for the authenticated user's store.
 *
 * Wrapped with React.cache() to deduplicate calls within a single server render.
 */
const listStoreCategoriesByStoreId = cache(async (storeId: string): Promise<StoreCategory[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_categories')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[listStoreCategories] Query failed:', error)
    return []
  }

  return (data || []) as StoreCategory[]
})

/**
 * List all categories for the authenticated user's store.
 *
 * Wrapped with React.cache() to deduplicate calls within a single server render.
 */
export async function listStoreCategories(storeId?: string): Promise<StoreCategory[]> {
  const resolvedStoreId = storeId ?? (await getAdminStoreContext())?.store.id
  if (!resolvedStoreId) return []
  return listStoreCategoriesByStoreId(resolvedStoreId)
}

/**
 * Create a new category.
 */
export async function createCategory(data: CategoryFormData): Promise<{ category: StoreCategory | null; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { category: null, error: 'No store context' }

  const slug = data.slug || generateSlug(data.name)

  const { data: category, error } = await supabase
    .from('store_categories')
    .insert({
      store_id: context.store.id,
      name: data.name,
      name_ar: data.name_ar ?? null,
      slug,
      parent_id: data.parent_id ?? null,
      image_url: data.image_url ?? null,
      sort_order: data.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error('[createCategory] Failed:', error)
    return { category: null, error: error.message }
  }

  return { category: category as StoreCategory }
}

/**
 * Update an existing category.
 */
export async function updateCategory(
  categoryId: string,
  data: Partial<CategoryFormData>
): Promise<{ category: StoreCategory | null; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { category: null, error: 'No store context' }

  const updateData: Record<string, unknown> = { ...data }
  if (data.name && !data.slug) {
    updateData.slug = generateSlug(data.name)
  }

  const { data: category, error } = await supabase
    .from('store_categories')
    .update(updateData)
    .eq('id', categoryId)
    .eq('store_id', context.store.id)
    .select()
    .single()

  if (error) return { category: null, error: error.message }
  return { category: category as StoreCategory }
}

/**
 * Delete a category.
 */
export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store context' }

  const { error } = await supabase
    .from('store_categories')
    .delete()
    .eq('id', categoryId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Reorder categories by updating sort_order.
 */
export async function reorderCategories(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store context' }

  // Update each category's sort_order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('store_categories')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('store_id', context.store.id)
  )

  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }
  return { success: true }
}
