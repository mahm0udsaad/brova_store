import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mapProductRow, type PlatformProductRow } from "@/lib/supabase/queries/products"

// Platform products select (from platform_products view)
const platformProductSelect =
  "id,store_id,legacy_product_id,name,price,inventory,status,category_id,gender,sizes,image_url,images,description,published"

/**
 * GET /api/products
 * Returns products from platform_products view
 * Uses platform product IDs (UUIDs) and enforces tenant isolation via RLS
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "12", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)
  const category = searchParams.get("category") || "all"

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const products = (data as PlatformProductRow[]).map(mapProductRow)
  const hasMore = (count ?? 0) > offset + products.length

  return NextResponse.json({
    products,
    count: count ?? 0,
    hasMore,
    nextOffset: offset + products.length,
  })
}
