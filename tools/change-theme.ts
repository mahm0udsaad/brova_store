import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const changeThemeTool = tool({
  description:
    "Change the store's visual theme including colors, font, and layout style.",

  inputSchema: z.object({
    storeId: z.string().describe("Store ID"),
    primaryColor: z.string().optional().describe("Primary brand color (hex)"),
    secondaryColor: z.string().optional().describe("Secondary color (hex)"),
    backgroundColor: z.string().optional().describe("Background color (hex)"),
    textColor: z.string().optional().describe("Text color (hex)"),
    fontFamily: z
      .enum(["IBM_Plex_Sans_Arabic", "Tajawal", "Cairo", "Almarai", "Noto_Sans_Arabic"])
      .optional()
      .describe("Arabic font family"),
    layoutStyle: z
      .enum(["modern", "classic", "minimal", "bold"])
      .optional()
      .describe("Overall layout style"),
  }),

  execute: async ({ storeId, ...theme }) => {
    const supabase = await createClient()

    // Filter out undefined values
    const themeUpdates = Object.fromEntries(
      Object.entries(theme).filter(([, v]) => v !== undefined)
    )

    const { error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: storeId,
          key: "theme",
          value: { ...themeUpdates, updated_at: new Date().toISOString() },
        },
        { onConflict: "store_id,key" }
      )

    if (error) {
      return {
        status: "error" as const,
        error: error.message,
        message_ar: "فشل في تغيير المظهر",
      }
    }

    return {
      status: "changed" as const,
      updatedFields: Object.keys(themeUpdates),
      theme: themeUpdates,
      message_ar: "تم تحديث مظهر المتجر",
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.status === "changed"
      ? `Theme updated: ${output.updatedFields.join(", ")}`
      : `Failed: ${output.error}`,
  }),
})
