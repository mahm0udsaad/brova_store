import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { updateCategory, deleteCategory } from "@/lib/supabase/queries/admin-categories"
import { NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/admin/categories/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { category, error } = await updateCategory(id, body)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ category })
}

/**
 * DELETE /api/admin/categories/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success, error } = await deleteCategory(id)
  if (!success) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
