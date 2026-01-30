import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"
import { verifyProductOwnership, getStoreProduct } from "@/lib/supabase/queries/admin-store"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/admin/products/[id]/ai
 *
 * AI action hooks for products. Returns suggestions — never auto-applies.
 * Actions: improve-description, suggest-category, optimize-price
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ownsProduct = await verifyProductOwnership(id)
  if (!ownsProduct) {
    return NextResponse.json({ error: "Product not found or access denied" }, { status: 403 })
  }

  const { action, context: actionContext } = await req.json()
  const product = await getStoreProduct(id)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  switch (action) {
    case 'improve-description': {
      // Hook: will call editing agent with product context
      // For now, return a placeholder that the frontend can use
      return NextResponse.json({
        action,
        productId: id,
        original: {
          description: product.description,
          description_ar: product.description_ar,
        },
        // Suggestion will be populated when AI agent integration is connected
        suggestion: null,
        status: 'pending',
        message: 'AI improvement queued. Connect editing agent to generate suggestions.',
      })
    }

    case 'suggest-category': {
      return NextResponse.json({
        action,
        productId: id,
        original: {
          category: product.category,
          category_ar: product.category_ar,
        },
        suggestion: null,
        status: 'pending',
        message: 'Category suggestion queued. Connect product intel agent.',
      })
    }

    case 'optimize-price': {
      return NextResponse.json({
        action,
        productId: id,
        original: { price: product.price },
        suggestion: null,
        status: 'pending',
        message: 'Price optimization queued. Connect pricing agent.',
      })
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
