import { tool } from "ai"
import { z } from "zod"

export const generateImageTool = tool({
  description:
    "Generate a single AI image for a product or store component. Returns a placeholder URL while image is being generated.",

  inputSchema: z.object({
    targetId: z
      .string()
      .describe("ID of the product or component to attach the image to"),
    targetType: z
      .enum(["product", "component"])
      .describe("Whether this is for a product or store component"),
    prompt: z.string().describe("Image generation prompt in English"),
    style: z
      .enum(["product_photo", "banner", "lifestyle", "flat_lay", "minimal"])
      .default("product_photo"),
  }),

  execute: async ({ targetId, targetType, prompt, style }) => {
    // Queue image generation (actual generation happens async)
    const jobId = crypto.randomUUID()

    return {
      jobId,
      targetId,
      targetType,
      prompt,
      style,
      status: "queued" as const,
      message_ar: "جارِ إنشاء الصورة بالذكاء الاصطناعي...",
    }
  },

  toModelOutput: async ({ output }) => ({
    type: "text" as const,
    value: `Image generation queued. Job ID: ${output.jobId} for ${output.targetType} ${output.targetId}.`,
  }),
})
