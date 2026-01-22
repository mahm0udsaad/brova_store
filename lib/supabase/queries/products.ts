import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

// Supabase Storage base URL for product images
const SUPABASE_STORAGE_URL = "https://alpozkmftvqjqozkkoyz.supabase.co/storage/v1/object/public"

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

const productSelect =
  "id,name,price,category_id,gender,sizes,image_url,images,description,published"

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

export async function listStorefrontProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .or("published.is.true,price.not.is.null")
    .order("created_at", { ascending: false })

  if (error) return { data: [], error }
  return { data: (data as ProductRow[]).map(mapProductRow), error: null }
}

export async function getStorefrontProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .or("published.is.true,price.not.is.null")
    .maybeSingle()

  if (error || !data) return { data: null, error: error ?? null }
  return { data: mapProductRow(data as ProductRow), error: null }
}
