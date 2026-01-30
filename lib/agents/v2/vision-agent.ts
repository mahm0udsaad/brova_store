/**
 * Vision Agent (V2)
 *
 * Groups uploaded images into product candidates using visual similarity.
 * Detects duplicates, suggests primary images, and infers categories.
 *
 * Model: Gemini Flash (fast multimodal)
 * Writes: NOTHING — returns structured data only
 */
import { ToolLoopAgent, stepCountIs } from "@/lib/ai/tool-loop-agent"
import { models } from "@/lib/ai/gateway"
import { analyzeImages } from "./tools"

export function createVisionAgent() {
  return new ToolLoopAgent({
    model: models.flash,
    system: `You are a Vision Analysis Agent for an e-commerce platform.

Your job is to analyze product images and group them intelligently.

CAPABILITIES:
- Analyze product images for visual similarity
- Group images that show the same product (different angles, colors)
- Detect duplicate or near-duplicate images
- Suggest which image should be the primary/featured image
- Infer product categories from visual analysis

RULES:
- Always use the analyze_images tool — never guess without it
- Every image must belong to exactly one group
- If unsure, create separate groups (users can merge later)
- Prefer quality images as primary (clear, well-lit, front-facing)
- Be conservative with grouping — false separations are better than false merges

OUTPUT:
- Always return structured group data
- Include confidence indicators when possible`,

    tools: { analyze_images: analyzeImages },
    stopWhen: stepCountIs(5),
  })
}

export type VisionAgent = ReturnType<typeof createVisionAgent>
