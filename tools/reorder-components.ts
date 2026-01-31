import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const reorderComponentsTool = tool({
  description:
    "Reorder store components by setting new positions. Use when the user wants to rearrange sections.",

  inputSchema: z.object({
    order: z
      .array(
        z.object({
          componentId: z.string(),
          position: z.number(),
        })
      )
      .describe("New ordering of components"),
    storeId: z.string().describe("Store ID"),
  }),

  execute: async ({ order, storeId }) => {
    const supabase = await createClient()

    const updates = order.map(({ componentId, position }) =>
      supabase
        .from("store_components")
        .update({ position })
        .eq("id", componentId)
        .eq("store_id", storeId)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error)

    if (errors.length > 0) {
      return {
        status: "partial_error" as const,
        reordered: order.length - errors.length,
        failed: errors.length,
        message_ar: `تم ترتيب ${order.length - errors.length} من ${order.length} مكونات`,
      }
    }

    return {
      status: "reordered" as const,
      count: order.length,
      message_ar: `تم إعادة ترتيب ${order.length} مكونات بنجاح`,
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: `Reordered ${output.status === "reordered" ? output.count : "some"} components.`,
  }),
})
