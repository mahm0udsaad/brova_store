import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const previewStoreTool = tool({
  description:
    "Generate a preview summary of the store's current state. Use to show the user what their store looks like so far.",

  inputSchema: z.object({
    storeId: z.string().describe("Store ID"),
  }),

  execute: async ({ storeId }) => {
    const supabase = await createClient()

    const [componentsResult, productsResult, settingsResult] = await Promise.all([
      supabase
        .from("store_components")
        .select("id, component_type, position, config")
        .eq("store_id", storeId)
        .order("position"),
      supabase
        .from("store_products")
        .select("id, name_ar, price, status, image_url")
        .eq("store_id", storeId)
        .limit(20),
      supabase
        .from("store_settings")
        .select("key, value")
        .eq("store_id", storeId),
    ])

    const components = componentsResult.data || []
    const products = productsResult.data || []
    const settings = settingsResult.data || []

    const theme = settings.find((s) => s.key === "theme")?.value
    const payments = settings.find((s) => s.key === "payment_methods")?.value

    return {
      storeId,
      components: components.map((c) => ({
        type: c.component_type,
        position: c.position,
      })),
      componentCount: components.length,
      productCount: products.length,
      products: products.map((p) => ({
        name_ar: p.name_ar,
        price: p.price,
        hasImage: !!p.image_url,
      })),
      theme: theme || null,
      paymentsConfigured: !!payments,
      message_ar: `متجرك يحتوي على ${components.length} مكونات و ${products.length} منتج`,
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: `Store preview: ${output.componentCount} components, ${output.productCount} products. Payments: ${output.paymentsConfigured ? "configured" : "not configured"}.`,
  }),
})
