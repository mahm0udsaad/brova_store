import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { reorderCategories } from "@/lib/supabase/queries/admin-categories"
import { NextRequest, NextResponse } from "next/server"

/**
 * PUT /api/admin/categories/reorder
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderedIds } = await req.json()
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds array required" }, { status: 400 })
  }

  const { success, error } = await reorderCategories(orderedIds)
  if (!success) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
