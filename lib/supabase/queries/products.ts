import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

// Supabase Storage base URL for product images
const SUPABASE_STORAGE_URL = "https://alpozkmftvqjqozkkoyz.supabase.co/storage/v1/object/public"

/**
 * Product row from legacy products table
 */
export interface ProductRow {
  id: string
  name: string
  price: number | null
  category_id: string | null
  gender: "men" | "women" | "unisex" | null
  sizes: string[] | null
  image_url: string | null
  images: string[] | null
  description: string | null
  published?: boolean | null
}

/**
 * Platform product row from platform_products view
 * Uses UUID as id, includes store context
 */
export interface PlatformProductRow extends ProductRow {
  store_id: string
  legacy_product_id: string | null
  inventory: number
  status: "active" | "draft"
}

// Select for legacy products table
const productSelect =
  "id,name,price,category_id,gender,sizes,image_url,images,description,published"

// Select for platform_products view (storefront reads)
const platformProductSelect =
  "id,store_id,legacy_product_id,name,price,inventory,status,category_id,gender,sizes,image_url,images,description,published"

/**
 * Converts local image paths to Supabase Storage URLs
 * /products/... -> https://supabase.co/storage/v1/object/public/products/...
 */
function toStorageUrl(path: string | null): string | null {
  if (!path) return null
  // If it's already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  // If it's a product image path, convert to Supabase Storage URL
  if (path.startsWith("/products/")) {
    return `${SUPABASE_STORAGE_URL}${path}`
  }
  // Otherwise return the path as-is (for other local images)
  return path
}

function normalizeImages(row: ProductRow): { image: string; images: string[] } {
  const gallery = (row.images ?? [])
    .filter(Boolean)
    .map(img => toStorageUrl(img) || img)
  const main = toStorageUrl(row.image_url) || gallery[0] || "/placeholder.svg"
  return {
    image: main,
    images: gallery.length > 0 ? gallery : [main],
  }
}

export function mapProductRow(row: ProductRow): Product {
  const { image, images } = normalizeImages(row)
  return {
    id: row.id,
    name: row.name,
    price: row.price ?? null,
    category: row.category_id || "other",
    gender: (row.gender || "unisex") as Product["gender"],
    sizes: row.sizes ?? [],
    image,
    images,
    description: row.description ?? "",
  }
}

/**
 * List storefront products from platform_products view
 * Uses platform product IDs (UUIDs) and enforces tenant isolation via RLS
 */
export async function listStorefrontProducts(options?: {
  limit?: number
  offset?: number
  category?: string
}) {
  const { limit = 12, offset = 0, category } = options ?? {}
  const supabase = await createClient()

  // Query platform_products view (joins store_products + legacy products)
  // RLS is enforced via store_products base table
  let query = supabase
    .from("platform_products")
    .select(platformProductSelect, { count: "exact" })
    .eq("status", "active") // Platform uses status instead of published
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category.toLowerCase() !== "all") {
    query = query.eq("category_id", category.toLowerCase())
  }

  const { data, error, count } = await query

  if (error) return { data: [], error, count: 0, hasMore: false }
  
  // Map platform products to Product type (same interface for backwards compatibility)
  const products = (data as PlatformProductRow[]).map(mapProductRow)
  const hasMore = (count ?? 0) > offset + products.length

  return { data: products, error: null, count: count ?? 0, hasMore }
}

/**
 * Get a single storefront product by platform ID (UUID)
 * Uses platform_products view for tenant isolation
 */
export async function getStorefrontProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("platform_products")
    .select(platformProductSelect)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle()

  if (error || !data) return { data: null, error: error ?? null }
  return { data: mapProductRow(data as PlatformProductRow), error: null }
}

/**
 * Get a single storefront product by legacy product ID
 * Useful for backwards compatibility during transition
 */
export async function getStorefrontProductByLegacyId(legacyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("platform_products")
    .select(platformProductSelect)
    .eq("legacy_product_id", legacyId)
    .eq("status", "active")
    .maybeSingle()

  if (error || !data) return { data: null, error: error ?? null }
  return { data: mapProductRow(data as PlatformProductRow), error: null }
}
