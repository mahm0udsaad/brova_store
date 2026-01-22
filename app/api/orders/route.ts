import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = (await request.json()) as OrderPayload

    if (!body?.items?.length) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        items: body.items,
        address: body.address,
        phone: body.phone,
        full_name: body.fullName,
        subtotal: body.subtotal,
        shipping_fee: body.shippingFee,
        total: body.total,
        status: "pending",
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orderId: data.id })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create order" }, { status: 500 })
  }
}
