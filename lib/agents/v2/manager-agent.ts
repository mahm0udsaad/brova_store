/**
 * AI Manager Agent (V2) — Orchestrator
 *
 * Owns the workflow state. Decides which agent runs next.
 * Produces Generative UI (buttons, cards, sliders).
 * Never mutates DB directly (except via confirm_and_persist tool).
 *
 * Model: Gemini Pro (reasoning for orchestration)
 */
import { tool } from "ai"
import { ToolLoopAgent, stepCountIs } from "@/lib/ai/tool-loop-agent"
import { z } from "zod"
import { models } from "@/lib/ai/gateway"
import { createVisionAgent } from "./vision-agent"
import { createProductIntelAgent } from "./product-intel-agent"
import { createEditingAgent } from "./editing-agent"
import { createImageEditAgent } from "./image-edit-agent"
import {
  askUser,
  confirmAndPersist,
  updateDraft,
  discardDrafts,
  rewriteText,
} from "./tools"
import type { AgentContext, ImageGroup } from "./schemas"

/**
 * Create a Manager agent with full context
 */
export function createManagerAgent(context: AgentContext) {
  // Build delegation tools that call sub-agents internally
  const delegateToVision = tool({
    description:
      "Delegate image analysis to the Vision Agent. It will group images by visual similarity and suggest primary images. Use this when the user uploads multiple images.",
    parameters: z.object({
      image_urls: z
        .array(z.string())
        .describe("URLs of images to analyze"),
      batch_id: z.string().optional().describe("Batch ID for tracking"),
    }),
    execute: async ({ image_urls, batch_id }) => {
      const visionAgent = createVisionAgent()
      const result = await visionAgent.generate({
        prompt: `Analyze these ${image_urls.length} product images and group them by product similarity.
Image URLs: ${image_urls.join(", ")}
${batch_id ? `Batch ID: ${batch_id}` : ""}`,
      })

      // Extract the tool result from the agent's steps
      const toolResults = result.steps.flatMap(
        (s) => s.toolResults?.map((tr) => tr.result) || []
      )
      return toolResults[0] || { groups: [], total_images: image_urls.length, total_groups: 0 }
    },
  })

  const delegateToProductIntel = tool({
    description:
      "Delegate product detail generation to the Product Intelligence Agent. It will create bilingual (AR/EN) drafts with names, descriptions, categories, and tags. Use this after images have been grouped.",
    parameters: z.object({
      groups: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            image_urls: z.array(z.string()),
            primary_image_url: z.string(),
            category_hint: z.string().optional(),
          })
        )
        .describe("Image groups to generate details for"),
    }),
    execute: async ({ groups }) => {
      const intelAgent = createProductIntelAgent()

      // Process groups in parallel (max 3 concurrent)
      const results: any[] = []
      const concurrency = 3

      for (let i = 0; i < groups.length; i += concurrency) {
        const batch = groups.slice(i, i + concurrency)
        const batchResults = await Promise.all(
          batch.map((group, idx) =>
            intelAgent.generate({
              prompt: `Generate product details for this product:
Name: ${group.name}
Category hint: ${group.category_hint || "unknown"}
Images: ${group.image_urls.length}
Store type: ${context.store_type}
Locale: ${context.locale}
Store ID: ${context.store_id}
Merchant ID: ${context.merchant_id}
${context.batch_id ? `Batch ID: ${context.batch_id}` : ""}
Group index: ${i + idx}

Use the generate_product_details tool with the full group data.`,
            })
          )
        )

        for (const r of batchResults) {
          const toolResults = r.steps.flatMap(
            (s) => s.toolResults?.map((tr) => tr.result) || []
          )
          if (toolResults.length > 0) {
            results.push(toolResults[toolResults.length - 1])
          }
        }
      }

      return {
        drafts: results.filter((r) => r?.success),
        failed: results.filter((r) => !r?.success),
        total: groups.length,
      }
    },
  })

  const delegateToEditor = tool({
    description:
      "Delegate a text editing task to the Editing Agent. Use this when the user wants to refine a product name or description.",
    parameters: z.object({
      text: z.string().describe("Text to edit"),
      instruction: z.string().describe("Edit instruction"),
      field: z.enum(["name", "description"]),
      locale: z.enum(["en", "ar"]),
      draft_id: z.string().optional().describe("Draft ID to update after editing"),
    }),
    execute: async ({ text, instruction, field, locale, draft_id }) => {
      const editAgent = createEditingAgent()
      const result = await editAgent.generate({
        prompt: `Rewrite this product ${field} in ${locale === "ar" ? "Arabic" : "English"}: "${text}"
Instruction: ${instruction}

Use the rewrite_text tool.`,
      })

      const toolResults = result.steps.flatMap(
        (s) => s.toolResults?.map((tr) => tr.result) || []
      )
      return toolResults[0] || { original: text, rewritten: text }
    },
  })

  return new ToolLoopAgent({
    model: models.pro,
    system: `You are the AI Manager for a ${context.store_type === "clothing" ? "fashion/streetwear" : "car care"} e-commerce store.

CONTEXT:
- Merchant ID: ${context.merchant_id}
- Store ID: ${context.store_id}
- Locale: ${context.locale}
- Store type: ${context.store_type}
${context.batch_id ? `- Current batch: ${context.batch_id}` : ""}

YOUR ROLE:
You are the orchestrator. You coordinate specialized agents and present results to the user via interactive UI.

${
  (context as any).workflow_type === "onboarding"
    ? `
ONBOARDING WORKFLOW (USER'S FIRST PRODUCT CREATION):
This is ${context.locale === "ar" ? "تجربة الإعداد الأولى للمستخدم" : "the user's first experience with product creation"}.
- Be EXTRA encouraging and patient
- Celebrate small wins ("Great! You've created your first product!")
- Never auto-apply suggestions — ALWAYS ask for confirmation
- If user hesitates or says "skip this", offer to skip to manual setup
- Keep language simple and supportive
- Use emojis occasionally for warmth (✨, 🎯, ✅)
`
    : ""
}

WORKFLOW A — BULK IMAGE → PRODUCTS:
1. User uploads images → delegate_to_vision (groups them)
2. Present groups to user → ask_user ("Are these grouped correctly?")
3. User confirms → delegate_to_product_intel (generates drafts)
4. Present the generated drafts to the user for review.
5. User edits/approves → update_draft or delegate_to_editor
6. User confirms all → confirm_and_persist (saves to store)

WORKFLOW B — EDIT EXISTING PRODUCT:
1. User selects a draft to edit.
2. User requests text edit → delegate_to_editor
4. Present before/after → ask_user ("Use this version?")
5. User confirms → update_draft

RULES:
- NEVER write to the database directly except through confirm_and_persist
- ALWAYS ask for user confirmation before persisting
- Use ask_user for decisions (renders as buttons in the UI)
- Run vision and product intel in sequence (vision first, then intel)
- Be concise — no long text walls
- Respond in ${context.locale === "ar" ? "Arabic" : "English"} unless the user switches language
- When presenting options, keep them to 2-4 choices

GENERATIVE UI:
- ask_user → renders as MCQ buttons
- confirm_and_persist → shows success/failure summary

PERSONALITY:
- Professional but warm
- Proactive with suggestions
- Respects user authority over all decisions`,

    tools: {
      delegate_to_vision: delegateToVision,
      delegate_to_product_intel: delegateToProductIntel,
      delegate_to_editor: delegateToEditor,
      ask_user: askUser,
      confirm_and_persist: confirmAndPersist,
      update_draft: updateDraft,
      discard_drafts: discardDrafts,
      rewrite_text: rewriteText,
    },
    stopWhen: stepCountIs(30),
  })
}

export type ManagerAgent = ReturnType<typeof createManagerAgent>
