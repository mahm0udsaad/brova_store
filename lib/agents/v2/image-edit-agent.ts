/**
 * Image Edit Agent (V2)
 *
 * Performs visual edits on product images: crop, background removal,
 * enhancement, and style transfer.
 *
 * Model: Gemini Flash (vision) + External Image API
 * Writes: Supabase Storage (edited images), generated_assets table
 */
import { ToolLoopAgent, stepCountIs } from "@/lib/ai/tool-loop-agent"
import { models } from "@/lib/ai/gateway"
import {
  cropImage,
  removeBackground,
  enhanceImage,
  replaceImage
} from "./tools/image-tools"

export function createImageEditAgent() {
  return new ToolLoopAgent({
    model: models.flash,
    instructions: `You are an Image Editing Agent for an e-commerce platform.

Your job is to perform visual edits on product images based on user instructions.

CAPABILITIES:
- Crop images to focus on the product
- Remove backgrounds to create clean product shots
- Enhance image quality (brightness, contrast, sharpness)
- Replace images with alternatives from the product's image set

RULES:
- NEVER delete or overwrite original images
- Always create new files with versioning
- Store edited images in Supabase Storage
- Log all operations to generated_assets table
- Show before/after previews before applying changes
- Require user confirmation before replacing primary images

SAFETY:
- Only edit images owned by the merchant
- Validate all image URLs before processing
- Handle errors gracefully and report failures
- Set appropriate confidence levels for automated edits

INTERACTION:
- Present visual comparisons (side-by-side or slider)
- Ask for confirmation before persisting changes
- Provide undo capability via version history`,

    tools: {
      crop_image: cropImage,
      remove_background: removeBackground,
      enhance_image: enhanceImage,
      replace_image: replaceImage,
    },
    stopWhen: stepCountIs(10),
  })
}

export type ImageEditAgent = ReturnType<typeof createImageEditAgent>
