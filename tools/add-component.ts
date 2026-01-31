import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const addComponentTool = tool({
  description:
    "Add a store component to the preview. Use when the user wants to add a new section to their store.",

  inputSchema: z.object({
    componentType: z
      .enum([
        "hero_banner",
        "product_grid",
        "category_carousel",
        "featured_products",
        "testimonials",
        "about_section",
        "contact_form",
        "instagram_feed",
        "newsletter_signup",
        "announcement_bar",
        "trust_badges",
        "footer",
      ])
      .describe("The type of component to add"),
    config: z.record(z.unknown()).describe("Component configuration as JSON"),
    position: z
      .number()
      .optional()
      .describe("Position in the component list (0-indexed)"),
    storeId: z.string().describe("Store ID"),
  }),

  execute: async ({ componentType, config, position, storeId }) => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("store_components")
      .insert({
        store_id: storeId,
        component_type: componentType,
        config,
        position: position ?? 0,
        status: "active",
      })
      .select("id, position")
      .single()

    if (error) {
      return {
        id: null,
        componentType,
        status: "error" as const,
        error: error.message,
        message_ar: `فشل في إضافة ${componentType}: ${error.message}`,
      }
    }

    return {
      id: data.id,
      componentType,
      config,
      position: data.position,
      status: "added" as const,
      message_ar: `تم إضافة ${componentType} بنجاح`,
    }
  },

  toModelOutput: async ({ input, output }) => ({
    type: "text" as const,
    value: output.status === "added"
      ? `Component ${input.componentType} added at position ${output.position}. ID: ${output.id}`
      : `Failed to add component: ${output.error}`,
  }),
})
