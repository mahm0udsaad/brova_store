import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { verifyProductOwnership } from "@/lib/supabase/queries/admin-store"
import { NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/admin/products/[id]
 *
 * Update a product in the authenticated user's store.
 * Includes tenant verification - users can only update products in their own store.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check admin status
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify product ownership (tenant isolation)
  const ownsProduct = await verifyProductOwnership(id)
  if (!ownsProduct) {
    return NextResponse.json(
      { error: "Product not found or access denied" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const {
    status, price, inventory, images, name, name_ar,
    description, description_ar, category, category_ar,
    category_id, tags, sku, gender, sizes, colors, variants,
  } = body

  // Build update object (only include defined fields)
  const updateData: Record<string, any> = {}

  if (status !== undefined) {
    updateData.status = status
    if (status === 'active') updateData.published_at = new Date().toISOString()
  }
  if (price !== undefined) updateData.price = price
  if (inventory !== undefined) {
    updateData.inventory = inventory
    updateData.stock_quantity = inventory
  }
  if (images !== undefined) {
    updateData.images = images
    updateData.image_url = images?.[0] || null
  }
  if (name !== undefined) updateData.name = name
  if (name_ar !== undefined) updateData.name_ar = name_ar
  if (description !== undefined) updateData.description = description
  if (description_ar !== undefined) updateData.description_ar = description_ar
  if (category !== undefined) updateData.category = category
  if (category_ar !== undefined) updateData.category_ar = category_ar
  if (category_id !== undefined) updateData.category_id = category_id
  if (tags !== undefined) updateData.tags = tags
  if (sku !== undefined) updateData.sku = sku
  if (gender !== undefined) updateData.gender = gender
  if (sizes !== undefined) updateData.sizes = sizes
  if (colors !== undefined) updateData.colors = colors
  if (variants !== undefined) updateData.variants = variants

  // Update in store_products table
  const { error } = await supabase
    .from("store_products")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("[PATCH /api/admin/products/[id]] Update failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/admin/products/[id]
 *
 * Delete a product from the authenticated user's store.
 * Includes tenant verification - users can only delete products in their own store.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check admin status
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify product ownership (tenant isolation)
  const ownsProduct = await verifyProductOwnership(id)
  if (!ownsProduct) {
    return NextResponse.json(
      { error: "Product not found or access denied" },
      { status: 403 }
    )
  }

  // Delete from store_products table
  const { error } = await supabase
    .from("store_products")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[DELETE /api/admin/products/[id]] Delete failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
