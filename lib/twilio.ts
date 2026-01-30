import twilio from "twilio"

// Initialize Twilio client
const accountSid = process.env.TWILIO_SID
const authToken = process.env.TWILIO_AUTH_KEY
const messagingServiceSid = process.env.MESSAGING_SERVICES

if (!accountSid || !authToken || !messagingServiceSid) {
  console.warn("Twilio credentials not found. SMS functionality will be disabled.")
}

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

export interface SendSMSParams {
  to: string
  message: string
  orderId?: string
  userId?: string
}

/**
 * Send SMS using Twilio Messaging Service
 */
export async function sendSMS({ to, message, orderId, userId }: SendSMSParams) {
  if (!twilioClient || !messagingServiceSid) {
    return {
      success: false,
      error: "Twilio not configured",
    }
  }

  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = to.startsWith("+") ? to : `+${to}`

    // Send SMS
    const messageResponse = await twilioClient.messages.create({
      body: message,
      messagingServiceSid: messagingServiceSid,
      to: formattedPhone,
    })

    return {
      success: true,
      messageId: messageResponse.sid,
      status: messageResponse.status,
      to: messageResponse.to,
    }
  } catch (error: any) {
    console.error("Error sending SMS:", error)
    return {
      success: false,
      error: error.message || "Failed to send SMS",
      code: error.code,
    }
  }
}

/**
 * Send order confirmation SMS
 *
 * @param storeName - The name of the store (from store context)
 * @param storeUrl - The storefront URL (optional, defaults to generic path)
 */
export async function sendOrderConfirmationSMS(
  phone: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  storeName: string = "Your Store",
  storeUrl?: string
) {
  const trackingUrl = storeUrl ? `${storeUrl}/orders` : "/orders"
  const message = `🎉 Order Confirmed!\n\nHi ${customerName},\n\nYour order ${orderNumber} has been confirmed!\nTotal: ${totalAmount} EGP\n\nTrack your order: ${trackingUrl}\n\n- ${storeName} Team`

  return await sendSMS({ to: phone, message })
}

/**
 * Send order status update SMS
 *
 * @param storeName - The name of the store (from store context)
 * @param storeUrl - The storefront URL (optional, defaults to generic path)
 */
export async function sendOrderStatusSMS(
  phone: string,
  orderNumber: string,
  status: string,
  storeName: string = "Your Store",
  storeUrl?: string,
  trackingNumber?: string
) {
  const trackingUrl = storeUrl ? `${storeUrl}/orders` : "/orders"
  let message = ""

  switch (status) {
    case "confirmed":
      message = `✅ Order ${orderNumber} confirmed!\n\nYour order is being processed and will be shipped soon.\n\nTrack: ${trackingUrl}`
      break
    case "processing":
      message = `📦 Order ${orderNumber} is being prepared!\n\nWe're getting your items ready for shipment.\n\nTrack: ${trackingUrl}`
      break
    case "shipped":
      message = `🚚 Order ${orderNumber} has shipped!\n\n${trackingNumber ? `Tracking: ${trackingNumber}\n\n` : ""}Your order is on its way!\n\nTrack: ${trackingUrl}`
      break
    case "out_for_delivery":
      message = `📍 Order ${orderNumber} is out for delivery!\n\nYour order will arrive today.\n\nTrack: ${trackingUrl}`
      break
    case "delivered":
      message = `✨ Order ${orderNumber} delivered!\n\nThank you for shopping with ${storeName}!\n\nRate your experience: ${trackingUrl}`
      break
    case "cancelled":
      message = `❌ Order ${orderNumber} cancelled\n\nYour order has been cancelled. If you have questions, please contact us.\n\n- ${storeName} Team`
      break
    default:
      message = `📦 Order ${orderNumber} update\n\nStatus: ${status}\n\nTrack: ${trackingUrl}`
  }

  return await sendSMS({ to: phone, message })
}

/**
 * Send custom SMS to customer
 */
export async function sendCustomerSMS(
  phone: string,
  message: string,
  orderId?: string,
  userId?: string
) {
  return await sendSMS({ to: phone, message, orderId, userId })
}

/**
 * Send OTP/verification code
 *
 * @param storeName - The name of the store (optional, for branded OTP messages)
 */
export async function sendOTPSMS(phone: string, code: string, storeName?: string) {
  const brandText = storeName ? `Your ${storeName} verification code` : "Your verification code"
  const message = `${brandText} is: ${code}\n\nThis code expires in 10 minutes.\n\nDon't share this code with anyone.`

  return await sendSMS({ to: phone, message })
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation - can be enhanced
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "")
  return cleaned
}

/**
 * Get SMS delivery status
 */
export async function getSMSStatus(messageId: string) {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" }
  }

  try {
    const message = await twilioClient.messages(messageId).fetch()
    return {
      success: true,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    }
  } catch (error: any) {
    console.error("Error fetching SMS status:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
