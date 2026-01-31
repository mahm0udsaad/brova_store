import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const addProductTool = tool({
  description:
    "Add a single product to the store. Use when the user describes one product to add.",

  inputSchema: z.object({
    name_ar: z.string().describe("Product name in Arabic"),
    name_en: z.string().optional().describe("Product name in English"),
    price: z.number().describe("Product price"),
    currency: z
      .enum(["SAR", "EGP", "AED", "KWD", "USD"])
      .default("SAR"),
    category_ar: z.string().optional().describe("Category in Arabic"),
    description_ar: z.string().optional().describe("Description in Arabic"),
    description_en: z.string().optional().describe("Description in English"),
    storeId: z.string().describe("Store ID"),
  }),

  execute: async ({
    name_ar,
    name_en,
    price,
    currency,
    category_ar,
    description_ar,
    description_en,
    storeId,
  }) => {
    const supabase = await createClient()

    const slug = `${(name_en || name_ar).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

    const { data, error } = await supabase
      .from("store_products")
      .insert({
        store_id: storeId,
        name: name_en || name_ar,
        name_ar,
        description: description_en,
        description_ar,
        category_ar,
        price,
        status: "draft",
        ai_generated: true,
        ai_confidence: "high",
        inventory: 0,
        slug,
      })
      .select("id")
      .single()

    if (error) {
      return {
        id: null,
        status: "error" as const,
        error: error.message,
        message_ar: `فشل في إضافة المنتج: ${error.message}`,
      }
    }

    return {
      id: data.id,
      name_ar,
      price,
      currency,
      status: "added" as const,
      message_ar: `تم إضافة "${name_ar}" بنجاح`,
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.status === "added"
      ? `Product "${output.name_ar}" added. ID: ${output.id}`
      : `Failed: ${output.error}`,
  }),
})
