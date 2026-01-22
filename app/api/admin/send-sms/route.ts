import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin"
import { sendCustomerSMS } from "@/lib/twilio"

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

    const { phone, message, orderId, userId } = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      )
    }

    // Send SMS
    const result = await sendCustomerSMS(phone, message, orderId, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send SMS" },
        { status: 500 }
      )
    }

    // Log activity
    if (userId && orderId) {
      await supabase.from("user_activity_log").insert({
        user_id: userId,
        order_id: orderId,
        action_type: "sms_sent",
        action_data: {
          phone,
          message,
          message_id: result.messageId,
          status: result.status,
        },
        performed_by: user.id,
      })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
    })
  } catch (error: any) {
    console.error("Error in send-sms API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
