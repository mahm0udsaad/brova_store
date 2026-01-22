import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin"
import { sendOrderStatusSMS } from "@/lib/twilio"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if user is admin
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, phone, status, trackingNumber } = await request.json()

    if (!orderId || !phone || !status) {
      return NextResponse.json(
        { error: "Order ID, phone, and status are required" },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number, user_id")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Send SMS
    const result = await sendOrderStatusSMS(
      phone,
      order.order_number,
      status,
      trackingNumber
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send SMS" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("user_activity_log").insert({
      user_id: order.user_id,
      order_id: orderId,
      action_type: "order_sms_sent",
      action_data: {
        phone,
        status,
        tracking_number: trackingNumber,
        message_id: result.messageId,
        sms_status: result.status,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
    })
  } catch (error: any) {
    console.error("Error in send-order-sms API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
