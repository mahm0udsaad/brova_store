import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const configurePaymentsTool = tool({
  description:
    "Configure payment methods for the store. Supports Tabby, Apple Pay, PayMob, and Stripe.",

  inputSchema: z.object({
    storeId: z.string().describe("Store ID"),
    methods: z
      .array(
        z.enum(["tabby", "apple_pay", "paymob", "stripe", "cod"])
      )
      .describe("Payment methods to enable"),
    currency: z
      .enum(["SAR", "EGP", "AED", "KWD", "USD"])
      .default("SAR")
      .describe("Default currency"),
  }),

  execute: async ({ storeId, methods, currency }) => {
    const supabase = await createClient()

    const { error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: storeId,
          key: "payment_methods",
          value: { methods, currency, configured_at: new Date().toISOString() },
        },
        { onConflict: "store_id,key" }
      )

    if (error) {
      return {
        status: "error" as const,
        error: error.message,
        message_ar: "فشل في إعداد طرق الدفع",
      }
    }

    const methodNames: Record<string, string> = {
      tabby: "تابي",
      apple_pay: "Apple Pay",
      paymob: "باي موب",
      stripe: "بطاقة ائتمان",
      cod: "الدفع عند الاستلام",
    }

    return {
      status: "configured" as const,
      methods,
      currency,
      message_ar: `تم تفعيل: ${methods.map((m) => methodNames[m] || m).join("، ")}`,
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.status === "configured"
      ? `Payment methods configured: ${output.methods.join(", ")}. Currency: ${output.currency}`
      : `Failed: ${output.error}`,
  }),
})
