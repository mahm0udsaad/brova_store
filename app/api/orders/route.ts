import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveTenant } from "@/lib/tenant-resolver"
import { getStorefrontContext } from "@/lib/supabase/queries/storefront"

type OrderPayload = {
  items: unknown[]
  address: string
  phone: string
  fullName: string
  subtotal: number
  shippingFee: number
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth is optional — guest checkout is allowed for COD
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = (await request.json()) as OrderPayload

    if (!body?.items?.length) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 })
    }

    if (!body.fullName?.trim() || !body.phone?.trim() || !body.address?.trim()) {
      return NextResponse.json({ error: "Name, phone, and address are required" }, { status: 400 })
    }

    // Resolve store from tenant context (subdomain/domain), not from buyer's org
    const tenantSlug = await resolveTenant()
    const context = await getStorefrontContext(tenantSlug)

    if (!context || context.store.status !== 'active') {
      return NextResponse.json({
        error: "Store not found or not active."
      }, { status: 400 })
    }

    // Generate order number: ORD-XXXXXXXX
    const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        store_id: context.store.id,
        order_number: orderNumber,
        customer_name: body.fullName,
        customer_phone: body.phone,
        address: body.address,
        items: body.items,
        subtotal: body.subtotal,
        shipping_fee: body.shippingFee,
        total: body.total,
        status: "pending",
        payment_method: "cod",
      })
      .select("id, order_number")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orderId: data.id, orderNumber: data.order_number })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create order" }, { status: 500 })
  }
}
