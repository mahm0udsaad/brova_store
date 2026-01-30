/**
 * Admin Product Queries
 *
 * Cursor-based pagination, search, filters, and bulk operations.
 * All queries scoped to the authenticated user's store.
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext, type StoreProduct } from "./admin-store"

export interface ProductListParams {
  cursor?: string        // "updated_at|id" composite cursor
  limit?: number         // default 20
  search?: string        // ilike on name, sku
  status?: 'draft' | 'active'
  categoryId?: string
  stockLevel?: 'in_stock' | 'low_stock' | 'out_of_stock'
  orderBy?: 'updated_at' | 'created_at' | 'name' | 'price'
  ascending?: boolean
}

export interface ProductListResult {
  products: StoreProduct[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
}

export interface ProductFormData {
  name: string
  name_ar?: string | null
  description?: string | null
  description_ar?: string | null
  price: number
  inventory?: number
  stock_quantity?: number
  status?: 'draft' | 'active'
  category?: string | null
  category_ar?: string | null
  category_id?: string | null
  tags?: string[]
  image_url?: string | null
  images?: string[]
  sku?: string | null
  gender?: 'men' | 'women' | 'unisex' | 'kids' | null
  sizes?: string[]
  colors?: string[]
  variants?: Record<string, unknown>[]
}

/**
 * Cursor-paginated product list with search and filters.
 */
export async function listProductsPaginated(params: ProductListParams = {}): Promise<ProductListResult> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return { products: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }

  const limit = params.limit ?? 20
  const orderBy = params.orderBy ?? 'updated_at'
  const ascending = params.ascending ?? false

  // Count query
  let countQuery = supabase
    .from('store_products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', context.store.id)

  if (params.status) countQuery = countQuery.eq('status', params.status)
  if (params.categoryId) countQuery = countQuery.eq('category_id', params.categoryId)
  if (params.search) {
    countQuery = countQuery.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }
  if (params.stockLevel === 'out_of_stock') countQuery = countQuery.eq('stock_quantity', 0)
  if (params.stockLevel === 'low_stock') countQuery = countQuery.gt('stock_quantity', 0).lte('stock_quantity', 5)
  if (params.stockLevel === 'in_stock') countQuery = countQuery.gt('stock_quantity', 5)

  const { count: totalCount } = await countQuery

  // Data query - fetch limit+1 to detect hasMore
  let query = supabase
    .from('store_products')
    .select('*')
    .eq('store_id', context.store.id)
    .order(orderBy, { ascending })
    .order('id', { ascending })
    .limit(limit + 1)

  if (params.status) query = query.eq('status', params.status)
  if (params.categoryId) query = query.eq('category_id', params.categoryId)
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }
  if (params.stockLevel === 'out_of_stock') query = query.eq('stock_quantity', 0)
  if (params.stockLevel === 'low_stock') query = query.gt('stock_quantity', 0).lte('stock_quantity', 5)
  if (params.stockLevel === 'in_stock') query = query.gt('stock_quantity', 5)

  // Apply cursor
  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split('|')
    if (ascending) {
      query = query.or(`${orderBy}.gt.${cursorDate},and(${orderBy}.eq.${cursorDate},id.gt.${cursorId})`)
    } else {
      query = query.or(`${orderBy}.lt.${cursorDate},and(${orderBy}.eq.${cursorDate},id.lt.${cursorId})`)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('[listProductsPaginated] Query failed:', error)
    return { products: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }

  const products = (data || []) as StoreProduct[]
  const hasMore = products.length > limit
  const page = hasMore ? products.slice(0, limit) : products

  let nextCursor: string | null = null
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1]
    const cursorValue = last[orderBy as keyof StoreProduct] as string
    nextCursor = `${cursorValue}|${last.id}`
  }

  return {
    products: page,
    nextCursor,
    hasMore,
    totalCount: totalCount ?? 0,
  }
}

/**
 * Bulk update product status (publish/unpublish).
 */
export async function bulkUpdateStatus(productIds: string[], status: 'draft' | 'active'): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store context' }

  const updateData: Record<string, unknown> = { status }
  if (status === 'active') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('store_products')
    .update(updateData)
    .in('id', productIds)
    .eq('store_id', context.store.id)

  if (error) {
    console.error('[bulkUpdateStatus] Failed:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Bulk delete products.
 */
export async function bulkDeleteProducts(productIds: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store context' }

  const { error } = await supabase
    .from('store_products')
    .delete()
    .in('id', productIds)
    .eq('store_id', context.store.id)

  if (error) {
    console.error('[bulkDeleteProducts] Failed:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Create or update a product.
 */
export async function upsertProduct(
  data: ProductFormData,
  productId?: string
): Promise<{ product: StoreProduct | null; error?: string }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { product: null, error: 'No store context' }

  if (productId) {
    // Update existing
    const { data: product, error } = await supabase
      .from('store_products')
      .update(data)
      .eq('id', productId)
      .eq('store_id', context.store.id)
      .select()
      .single()

    if (error) return { product: null, error: error.message }
    return { product: product as StoreProduct }
  }

  // Create new - generate slug
  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`

  const { data: product, error } = await supabase
    .from('store_products')
    .insert({
      ...data,
      store_id: context.store.id,
      slug,
      status: data.status || 'draft',
      inventory: data.inventory ?? 0,
      stock_quantity: data.stock_quantity ?? 0,
    })
    .select()
    .single()

  if (error) return { product: null, error: error.message }
  return { product: product as StoreProduct }
}
