/**
 * Storefront Queries
 *
 * Public-facing queries for storefront rendering.
 * Tenant-isolated, theme-driven, bilingual support.
 *
 * Core Principle: No hardcoded store logic. Store resolved via context.
 */

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { validatePreviewToken } from "@/lib/actions/store-lifecycle"

/**
 * Storefront Product (from store_products table)
 */
export interface StorefrontProduct {
  id: string
  store_id: string
  name: string
  name_ar: string | null
  price: number
  currency: string
  inventory: number
  status: 'draft' | 'active'
  slug: string
  description: string | null
  description_ar: string | null
  category: string | null
  category_ar: string | null
  tags: string[]
  image_url: string | null
  images: string[]
  created_at: string
}

/**
 * Store Contact Info
 */
export interface StoreContact {
  store_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
}

/**
 * Store Context (public info)
 */
export interface StorefrontContext {
  store: {
    id: string
    name: string
    slug: string
    type: 'clothing' | 'car_care'
    status: 'draft' | 'active' | 'suspended' | 'archived'
    theme_id: string | null
    default_locale: string | null
    skin_id: string | null
  }
  organization: {
    id: string
    slug: string
  }
  contact: StoreContact | null
  primary_domain: string | null
}

/**
 * Storefront Category (from store_categories table)
 */
export interface StorefrontCategory {
  id: string
  store_id: string
  name: string
  name_ar: string | null
  slug: string
  image_url: string | null
  sort_order: number
}

/**
 * Get storefront context by organization slug
 *
 * For V1: Resolves to the single store for the organization
 * Future: Can support multi-store per organization
 *
 * Wrapped with React.cache() to deduplicate calls within a single server render.
 *
 * @param orgSlug - Organization slug (e.g., 'brova')
 * @returns Storefront context or null if not found
 */
/**
 * Get storefront context by organization slug.
 *
 * Options:
 *  - previewToken: If provided, bypasses the active-store check for draft stores.
 */
export const getStorefrontContext = cache(async (
  orgSlug: string,
  options?: { previewToken?: string }
): Promise<StorefrontContext | null> => {
  const supabase = await createClient()

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    console.error('[getStorefrontContext] Organization not found:', orgSlug, orgError)
    return null
  }

  // Get the organization's store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, slug, store_type, status, theme_id, default_locale, skin_id')
    .eq('organization_id', org.id)
    .single()

  if (storeError || !store) {
    console.error('[getStorefrontContext] Store not found for org:', orgSlug, storeError)
    return null
  }

  // Validate preview token for draft stores if provided
  if (store.status !== 'active' && options?.previewToken) {
    const preview = await validatePreviewToken(options.previewToken)
    if (!preview.valid || preview.storeId !== store.id) {
      return null
    }
  }
  // Non-active stores without preview token still return context
  // so the caller (e.g. storefront-home) can show "Store Unavailable"

  // Get store contact
  const { data: contact } = await supabase
    .from('store_contact')
    .select('store_name, email, phone, address, country')
    .eq('store_id', store.id)
    .single()

  // Get primary domain
  const { data: domain } = await supabase
    .from('store_domains')
    .select('domain')
    .eq('store_id', store.id)
    .eq('is_primary', true)
    .single()

  return {
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      type: store.store_type as 'clothing' | 'car_care',
      status: store.status as 'draft' | 'active' | 'suspended' | 'archived',
      theme_id: store.theme_id,
      default_locale: store.default_locale,
      skin_id: store.skin_id || null,
    },
    organization: {
      id: org.id,
      slug: org.slug,
    },
    contact: contact || null,
    primary_domain: domain?.domain || null
  }
})

/**
 * Get active products for storefront
 *
 * Only returns products with status='active'
 * Scoped to specific store_id (tenant isolation)
 *
 * @param storeId - Store UUID
 * @param options - Query options
 * @returns Array of active products
 */
export async function getStorefrontProducts(
  storeId: string,
  options?: {
    category?: string
    limit?: number
    offset?: number
  }
): Promise<StorefrontProduct[]> {
  const supabase = await createClient()

  const { limit = 50, offset = 0, category } = options ?? {}

  let query = supabase
    .from('store_products')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active') // Only active products visible publicly
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filter by category if provided
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getStorefrontProducts] Query failed:', error)
    return []
  }

  return (data || []) as StorefrontProduct[]
}

/**
 * Get a single product by ID for storefront
 *
 * Verifies:
 * - Product exists
 * - Product belongs to the specified store
 * - Product is active (not draft)
 *
 * @param productId - Product UUID
 * @param storeId - Store UUID
 * @returns Product or null
 */
export async function getStorefrontProduct(
  productId: string,
  storeId: string
): Promise<StorefrontProduct | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_products')
    .select('*')
    .eq('id', productId)
    .eq('store_id', storeId)
    .eq('status', 'active') // Only active products
    .single()

  if (error || !data) {
    console.error('[getStorefrontProduct] Product not found or not active:', productId, error)
    return null
  }

  return data as StorefrontProduct
}

/**
 * Get unique categories for a store's products
 *
 * Used for category filtering on storefront
 * Only includes categories from active products
 *
 * @param storeId - Store UUID
 * @param locale - 'en' or 'ar' for localized category names
 * @returns Array of unique categories
 */
export async function getStorefrontCategories(
  storeId: string,
  locale: 'en' | 'ar' = 'en'
): Promise<string[]> {
  const supabase = await createClient()

  const categoryField = locale === 'ar' ? 'category_ar' : 'category'

  const { data, error } = await supabase
    .from('store_products')
    .select(categoryField)
    .eq('store_id', storeId)
    .eq('status', 'active')
    .not(categoryField, 'is', null)

  if (error || !data) {
    console.error('[getStorefrontCategories] Query failed:', error)
    return []
  }

  // Extract unique categories
  const categories = new Set<string>()
  data.forEach((row: any) => {
    const cat = row[categoryField]
    if (cat) categories.add(cat)
  })

  return Array.from(categories).sort()
}

/**
 * Get categories for storefront from store_categories table.
 *
 * Returns ordered categories; fallback logic should be handled by caller if empty.
 */
export async function getStorefrontCategoryEntities(
  storeId: string
): Promise<StorefrontCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_categories')
    .select('id, store_id, name, name_ar, slug, image_url, sort_order')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error || !data) {
    console.error('[getStorefrontCategoryEntities] Query failed:', error)
    return []
  }

  return (data || []) as StorefrontCategory[]
}

// =============================================================================
// Store Components (from store_components table)
// =============================================================================

export interface StorefrontComponent {
  id: string
  store_id: string
  component_type: string
  config: Record<string, unknown>
  position: number
  status: 'active' | 'inactive'
}

/**
 * Get active store components ordered by position.
 * These define the storefront page layout.
 */
export async function getStorefrontComponents(
  storeId: string
): Promise<StorefrontComponent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_components')
    .select('id, store_id, component_type, config, position, status')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .order('position', { ascending: true })

  if (error || !data) {
    console.error('[getStorefrontComponents] Query failed:', error)
    return []
  }

  return (data || []) as StorefrontComponent[]
}

// =============================================================================
// Store Theme Settings (from store_settings table)
// =============================================================================

export interface StorefrontThemeConfig {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
  }
  typography?: {
    fontBody?: string
    fontHeading?: string
  }
}

export interface StorefrontSettings {
  appearance: Record<string, unknown> | null
  theme_config: StorefrontThemeConfig | null
}

/**
 * Get store theme settings (colors, fonts, branding).
 */
export async function getStorefrontSettings(
  storeId: string
): Promise<StorefrontSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_settings')
    .select('appearance, theme_config')
    .eq('store_id', storeId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    appearance: data.appearance as Record<string, unknown> | null,
    theme_config: data.theme_config as StorefrontThemeConfig | null,
  }
}

// =============================================================================
// Store Banners (from store_banners table)
// =============================================================================

export interface StorefrontBanner {
  id: string
  image_url: string
  title: string | null
  title_ar: string | null
  subtitle: string | null
  subtitle_ar: string | null
  cta_text: string | null
  cta_text_ar: string | null
  position: string
  sort_order: number
  is_active: boolean
}

/**
 * Get active banners for a store, ordered by sort_order.
 */
export async function getStorefrontBanners(
  storeId: string
): Promise<StorefrontBanner[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_banners')
    .select('id, image_url, title, title_ar, subtitle, subtitle_ar, cta_text, cta_text_ar, position, sort_order, is_active')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return (data || []) as StorefrontBanner[]
}