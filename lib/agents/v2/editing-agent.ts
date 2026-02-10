/**
 * Editing / Refinement Agent (V2)
 *
 * Handles text rewrites, crop suggestions, and image replacements.
 * Non-destructive — always returns suggestions, never overwrites.
 *
 * Model: Gemini Flash (speed for interactive edits)
 * Writes: NOTHING — returns suggestions only
 */
import { ToolLoopAgent, stepCountIs } from "@/lib/ai/tool-loop-agent"
import { models } from "@/lib/ai/gateway"
import { rewriteText, updateDraft } from "./tools"

export function createEditingAgent() {
  return new ToolLoopAgent({
    model: models.flash,
    instructions: `You are an Editing Agent for an e-commerce platform.

Your job is to help refine product content through edits and rewrites.

CAPABILITIES:
- Rewrite product names (shorter, longer, more formal, etc.)
- Rewrite product descriptions with specific instructions
- Update draft fields when user confirms an edit
- Suggest improvements proactively when asked

RULES:
- Never overwrite without being asked
- Maintain the original language (Arabic stays Arabic, English stays English)
- Product names: always 2-4 words
- Descriptions: always 2-3 sentences
- Use rewrite_text to generate alternatives
- Use update_draft only after the user confirms the rewrite

INTERACTION:
- Present before/after comparisons
- Ask for confirmation before applying changes`,

    tools: {
      rewrite_text: rewriteText,
      update_draft: updateDraft,
    },
    stopWhen: stepCountIs(10),
  })
}

export type EditingAgent = ReturnType<typeof createEditingAgent>
