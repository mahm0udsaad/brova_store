import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { listStoreCategories, createCategory } from "@/lib/supabase/queries/admin-categories"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/categories
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const storeContext = await getAdminStoreContext()
  const categories = storeContext
    ? await listStoreCategories(storeContext.store.id)
    : []
  return NextResponse.json({ categories })
}

/**
 * POST /api/admin/categories
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const { category, error } = await createCategory(body)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ category }, { status: 201 })
}
