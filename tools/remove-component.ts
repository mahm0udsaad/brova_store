import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const removeComponentTool = tool({
  description:
    "Remove a component from the store. This is destructive and requires user approval.",

  inputSchema: z.object({
    componentId: z.string().describe("UUID of the component to remove"),
    componentType: z
      .string()
      .describe("Type of the component being removed, for confirmation display"),
  }),

  needsApproval: true,

  execute: async ({ componentId }) => {
    const supabase = await createClient()

    const { error } = await supabase
      .from("store_components")
      .delete()
      .eq("id", componentId)

    if (error) {
      return {
        removed: false,
        componentId,
        error: error.message,
        message_ar: "فشل في حذف المكون",
      }
    }

    return {
      removed: true,
      componentId,
      message_ar: "تم حذف المكون بنجاح",
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.removed
      ? `Component ${output.componentId} removed.`
      : `Failed to remove: ${output.error}`,
  }),
})
