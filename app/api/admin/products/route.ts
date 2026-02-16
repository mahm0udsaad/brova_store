import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { listProductsPaginated, upsertProduct } from "@/lib/supabase/queries/admin-products"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/products
 * Paginated product list with search and filters.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl
  const result = await listProductsPaginated({
    cursor: url.searchParams.get('cursor') || undefined,
    limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
    search: url.searchParams.get('search') || undefined,
    status: (url.searchParams.get('status') as 'draft' | 'active') || undefined,
    categoryId: url.searchParams.get('categoryId') || undefined,
    stockLevel: (url.searchParams.get('stockLevel') as 'in_stock' | 'low_stock' | 'out_of_stock') || undefined,
    orderBy: (url.searchParams.get('orderBy') as 'updated_at' | 'created_at' | 'name' | 'price') || undefined,
    ascending: url.searchParams.get('ascending') === 'true',
  })

  return NextResponse.json(result)
}

/**
 * POST /api/admin/products
 * Create a new product.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const name =
    typeof body?.name === "string" ? body.name.trim() : ""
  const price = typeof body?.price === "number" ? body.price : Number(body?.price)
  const inventory =
    body?.inventory === undefined ? 0 : Number(body.inventory)

  if (!name) {
    return NextResponse.json(
      { error: "Product name is required" },
      { status: 400 }
    )
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "Price must be a non-negative number" },
      { status: 400 }
    )
  }
  if (!Number.isFinite(inventory) || inventory < 0) {
    return NextResponse.json(
      { error: "Inventory must be a non-negative number" },
      { status: 400 }
    )
  }

  const payload = {
    ...body,
    name,
    price,
    inventory,
  }
  const { product, error } = await upsertProduct(payload)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ product }, { status: 201 })
}
