import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const editComponentTool = tool({
  description:
    "Edit an existing store component's configuration. Use when the user wants to change text, colors, or settings of a section.",

  inputSchema: z.object({
    componentId: z.string().describe("UUID of the component to edit"),
    updates: z.record(z.unknown()).describe("Config fields to update"),
  }),

  execute: async ({ componentId, updates }) => {
    const supabase = await createClient()

    // Fetch current config
    const { data: existing, error: fetchError } = await supabase
      .from("store_components")
      .select("config, component_type")
      .eq("id", componentId)
      .single()

    if (fetchError) {
      return {
        componentId,
        status: "error" as const,
        error: fetchError.message,
        message_ar: "فشل في تحديث المكون",
      }
    }

    const mergedConfig = { ...existing.config, ...updates }

    const { error: updateError } = await supabase
      .from("store_components")
      .update({ config: mergedConfig, updated_at: new Date().toISOString() })
      .eq("id", componentId)

    if (updateError) {
      return {
        componentId,
        status: "error" as const,
        error: updateError.message,
        message_ar: "فشل في تحديث المكون",
      }
    }

    return {
      componentId,
      componentType: existing.component_type,
      updatedFields: Object.keys(updates),
      status: "updated" as const,
      message_ar: "تم تحديث المكون بنجاح",
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: output.status === "updated"
      ? `Component ${output.componentId} updated. Fields: ${output.updatedFields.join(", ")}`
      : `Failed: ${output.error}`,
  }),
})
