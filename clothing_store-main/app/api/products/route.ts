import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mapProductRow, type ProductRow } from "@/lib/supabase/queries/products"

// Supabase Storage base URL for product images
const SUPABASE_STORAGE_URL = "https://alpozkmftvqjqozkkoyz.supabase.co/storage/v1/object/public"

const productSelect =
  "id,name,price,category_id,gender,sizes,image_url,images,description,published"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "12", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)
  const category = searchParams.get("category") || "all"

  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .or("published.is.true,price.not.is.null")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category.toLowerCase() !== "all") {
    query = query.eq("category_id", category.toLowerCase())
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const products = (data as ProductRow[]).map(mapProductRow)
  const hasMore = (count ?? 0) > offset + products.length

  return NextResponse.json({
    products,
    count: count ?? 0,
    hasMore,
    nextOffset: offset + products.length,
  })
}
