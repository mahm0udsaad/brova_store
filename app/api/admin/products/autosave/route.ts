import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { upsertProduct } from "@/lib/supabase/queries/admin-products"
import { verifyProductOwnership } from "@/lib/supabase/queries/admin-store"
import { NextRequest, NextResponse } from "next/server"

/**
 * PUT /api/admin/products/autosave
 * Autosave endpoint for draft products. Only saves if product is in draft status.
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, ...data } = await req.json()

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 })
  }

  const ownsProduct = await verifyProductOwnership(productId)
  if (!ownsProduct) {
    return NextResponse.json({ error: "Product not found or access denied" }, { status: 403 })
  }

  // Only autosave draft products
  const { data: existing } = await supabase
    .from('store_products')
    .select('status')
    .eq('id', productId)
    .single()

  if (existing?.status !== 'draft') {
    return NextResponse.json({ error: "Autosave only available for draft products" }, { status: 400 })
  }

  const { product, error } = await upsertProduct(data, productId)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated_at: product?.updated_at })
}
