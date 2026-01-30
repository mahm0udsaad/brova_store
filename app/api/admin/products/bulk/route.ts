import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { bulkUpdateStatus, bulkDeleteProducts } from "@/lib/supabase/queries/admin-products"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/admin/products/bulk
 * Bulk actions: publish, unpublish, delete.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { action, productIds } = await req.json()

  if (!action || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "Invalid request: action and productIds required" }, { status: 400 })
  }

  let result: { success: boolean; error?: string }

  switch (action) {
    case 'publish':
      result = await bulkUpdateStatus(productIds, 'active')
      break
    case 'unpublish':
      result = await bulkUpdateStatus(productIds, 'draft')
      break
    case 'delete':
      result = await bulkDeleteProducts(productIds)
      break
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
