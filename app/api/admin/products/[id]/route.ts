import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { verifyProductOwnership } from "@/lib/supabase/queries/admin-store"
import { NextRequest, NextResponse } from "next/server"

function parseNonNegativeNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

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
    if (status !== "draft" && status !== "active") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    updateData.status = status
    if (status === 'active') updateData.published_at = new Date().toISOString()
  }
  if (price !== undefined) {
    const parsedPrice = parseNonNegativeNumber(price)
    if (parsedPrice === null) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      )
    }
    updateData.price = parsedPrice
  }
  if (inventory !== undefined) {
    const parsedInventory = parseNonNegativeNumber(inventory)
    if (parsedInventory === null) {
      return NextResponse.json(
        { error: "Inventory must be a non-negative number" },
        { status: 400 }
      )
    }
    updateData.inventory = parsedInventory
    updateData.stock_quantity = parsedInventory
  }
  if (images !== undefined) {
    if (!Array.isArray(images) || !images.every((img) => typeof img === "string")) {
      return NextResponse.json({ error: "Images must be an array of strings" }, { status: 400 })
    }
    updateData.images = images
    updateData.image_url = images?.[0] || null
  }
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }
    updateData.name = name.trim()
  }
  if (name_ar !== undefined) {
    updateData.name_ar = typeof name_ar === "string" ? name_ar.trim() || null : null
  }
  if (description !== undefined) {
    updateData.description = typeof description === "string" ? description.trim() || null : null
  }
  if (description_ar !== undefined) {
    updateData.description_ar = typeof description_ar === "string" ? description_ar.trim() || null : null
  }
  if (category !== undefined) {
    updateData.category = typeof category === "string" ? category.trim() || null : null
  }
  if (category_ar !== undefined) {
    updateData.category_ar = typeof category_ar === "string" ? category_ar.trim() || null : null
  }
  if (category_id !== undefined) updateData.category_id = category_id
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
      return NextResponse.json({ error: "Tags must be an array of strings" }, { status: 400 })
    }
    updateData.tags = tags.map((tag) => tag.trim()).filter(Boolean)
  }
  if (sku !== undefined) updateData.sku = typeof sku === "string" ? sku.trim() || null : null
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
