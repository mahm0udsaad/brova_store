/**
 * Admin Store Queries
 *
 * Centralized query functions for admin dashboard with tenant isolation.
 * All queries are scoped to the authenticated user's store.
 *
 * Core Principle: No special-casing. Access via owner_id, not hardcoded values.
 */

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * User's Organization and Store Data
 * Returned by get_user_organization() RPC
 */
export interface UserOrganizationData {
  organization_id: string
  organization_slug: string
  store_id: string
  store_slug: string
  store_type: 'clothing' | 'car_care'
  store_status: 'draft' | 'active' | 'suspended' | 'archived'
}

/**
 * Store Product from store_products table
 */
export interface StoreProduct {
  id: string
  store_id: string
  legacy_product_id: string | null
  name: string
  name_ar: string | null
  price: number
  inventory: number
  stock_quantity: number
  status: 'draft' | 'active'
  slug: string
  description: string | null
  description_ar: string | null
  currency: string
  category: string | null
  category_ar: string | null
  tags: string[]
  image_url: string | null
  images: string[]
  sku: string | null
  ai_generated: boolean
  ai_confidence: 'high' | 'medium' | 'low' | null
  created_at: string
  updated_at: string | null
  published_at: string | null
}

/**
 * Admin Store Context - Complete store information
 */
export interface AdminStoreContext {
  organization: {
    id: string
    slug: string
  }
  store: {
    id: string
    slug: string
    name: string
    type: 'clothing' | 'car_care'
    status: 'draft' | 'active' | 'suspended' | 'archived'
    theme_id: string | null
    onboarding_completed: string
  }
}

/**
 * Get the authenticated user's organization and store.
 *
 * This is the SINGLE SOURCE OF TRUTH for determining which store
 * the current user can access.
 *
 * Wrapped with React.cache() to deduplicate calls within a single server render.
 *
 * @returns Organization and store data, or null if not found
 */
const getAdminStoreContextByUserId = cache(async (userId: string): Promise<AdminStoreContext | null> => {
  const supabase = await createClient()

  // Get user's organization and store via RPC
  const { data: orgData, error: orgError } = await supabase
    .rpc('get_user_organization')
    .single<UserOrganizationData>()

  if (orgError || !orgData || !orgData.store_id) {
    console.error('[getAdminStoreContext] Failed to get organization:', orgError)
    return null
  }

  // Fetch full store details
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, slug, name, store_type, status, theme_id, onboarding_completed')
    .eq('id', orgData.store_id)
    .single()

  if (storeError || !store) {
    console.error('[getAdminStoreContext] Failed to get store details:', storeError)
    return null
  }

  return {
    organization: {
      id: orgData.organization_id,
      slug: orgData.organization_slug,
    },
    store: {
      id: store.id,
      slug: store.slug,
      name: store.name,
      type: store.store_type as 'clothing' | 'car_care',
      status: store.status as 'draft' | 'active' | 'suspended' | 'archived',
      theme_id: store.theme_id,
      onboarding_completed: store.onboarding_completed,
    },
  }
})

/**
 * Resolve the authenticated user's store context with cache keyed by user id.
 */
export async function getAdminStoreContext(): Promise<AdminStoreContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  return getAdminStoreContextByUserId(user.id)
}

/**
 * Get all products for the authenticated user's store.
 *
 * Products are scoped to the store via RLS and explicit filtering.
 * No cross-tenant access is possible.
 *
 * @param options - Query options (status filter, ordering, limit)
 * @returns Array of products for the user's store
 */
export async function getStoreProducts(options?: {
  status?: 'draft' | 'active'
  orderBy?: 'created_at' | 'updated_at' | 'name' | 'price'
  ascending?: boolean
  limit?: number
}): Promise<StoreProduct[]> {
  const supabase = await createClient()

  // Get user's store context
  const context = await getAdminStoreContext()
  if (!context) {
    console.error('[getStoreProducts] No store context found')
    return []
  }

  // Build query
  let query = supabase
    .from('store_products')
    .select('*')
    .eq('store_id', context.store.id)

  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Apply ordering
  const orderBy = options?.orderBy || 'created_at'
  const ascending = options?.ascending ?? false
  query = query.order(orderBy, { ascending })

  // Apply limit
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('[getStoreProducts] Query failed:', error)
    return []
  }

  return (products || []) as StoreProduct[]
}

/**
 * Get a single product by ID, with tenant verification.
 *
 * Returns null if:
 * - Product doesn't exist
 * - Product doesn't belong to user's store (tenant isolation)
 *
 * @param productId - Product UUID
 * @returns Product or null
 */
export async function getStoreProduct(productId: string): Promise<StoreProduct | null> {
  const supabase = await createClient()

  // Get user's store context
  const context = await getAdminStoreContext()
  if (!context) {
    console.error('[getStoreProduct] No store context found')
    return null
  }

  // Fetch product with tenant verification
  const { data: product, error } = await supabase
    .from('store_products')
    .select('*')
    .eq('id', productId)
    .eq('store_id', context.store.id) // Tenant isolation
    .single()

  if (error) {
    console.error('[getStoreProduct] Query failed:', error)
    return null
  }

  return product as StoreProduct
}

/**
 * Get product statistics for the authenticated user's store.
 *
 * Wrapped with React.cache() to deduplicate calls within a single server render.
 *
 * @returns Stats object with counts
 */
const getStoreProductStatsByStoreId = cache(async (storeId: string) => {
  const supabase = await createClient()

  // Get user's store context
  // Get counts by status
  const { count: totalCount } = await supabase
    .from('store_products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  const { count: activeCount } = await supabase
    .from('store_products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'active')

  const { count: draftCount } = await supabase
    .from('store_products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'draft')

  return {
    total: totalCount || 0,
    active: activeCount || 0,
    draft: draftCount || 0,
  }
})

/**
 * Get product statistics for a store, keyed by store id for tenant safety.
 */
export async function getStoreProductStats(storeId?: string) {
  const resolvedStoreId = storeId ?? (await getAdminStoreContext())?.store.id
  if (!resolvedStoreId) {
    return {
      total: 0,
      active: 0,
      draft: 0,
    }
  }

  return getStoreProductStatsByStoreId(resolvedStoreId)
}

/**
 * Verify that a product belongs to the authenticated user's store.
 *
 * Used in API routes before mutations (update/delete).
 *
 * @param productId - Product UUID
 * @returns true if product belongs to user's store, false otherwise
 */
export async function verifyProductOwnership(productId: string): Promise<boolean> {
  const supabase = await createClient()

  // Get user's store context
  const context = await getAdminStoreContext()
  if (!context) {
    return false
  }

  // Check if product exists in user's store
  const { data: product, error } = await supabase
    .from('store_products')
    .select('id')
    .eq('id', productId)
    .eq('store_id', context.store.id)
    .single()

  if (error || !product) {
    return false
  }

  return true
}
