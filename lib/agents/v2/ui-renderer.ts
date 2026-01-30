/**
 * Generative UI Renderer
 *
 * Converts agent tool results into structured UI instructions
 * that the client renders as interactive components.
 *
 * UI Types:
 * - question_card: MCQ buttons for user decisions
 * - draft_grid: Product draft cards with image sliders
 * - confirmation_card: Approve/reject with summary
 * - status_card: Success/failure result
 */

export type UIComponentType =
  | "question_card"
  | "draft_grid"
  | "confirmation_card"
  | "status_card"
  | "text"

export interface UIComponent {
  type: UIComponentType
  data: Record<string, any>
}

export interface QuestionCardData {
  question: string
  options: Array<{ label: string; value: string }>
  allow_multiple?: boolean
}

export interface DraftGridData {
  drafts: Array<{
    draft_id: string
    name: string
    name_ar?: string
    description?: string
    description_ar?: string
    image_urls: string[]
    primary_image_url: string
    suggested_price?: number
    category?: string
    category_ar?: string
    tags?: string[]
    ai_confidence?: "high" | "medium" | "low"
    status: string
  }>
}

export interface ConfirmationCardData {
  action: string
  description: string
  draft_ids: string[]
  total_products: number
}

export interface StatusCardData {
  success: boolean
  title: string
  message: string
  details?: Record<string, any>
}

/**
 * Extract UI components from agent tool calls and results.
 *
 * Scans each step of an agent result for known tool invocations
 * and converts their outputs into renderable UI components.
 */
export function extractUIComponents(
  steps: Array<{
    toolCalls?: Array<{ toolName: string; args: Record<string, any> }>
    toolResults?: Array<{ result: any }>
  }>
): UIComponent[] {
  const components: UIComponent[] = []

  for (const step of steps) {
    if (!step.toolCalls) continue

    for (let i = 0; i < step.toolCalls.length; i++) {
      const call = step.toolCalls[i]
      const result = step.toolResults?.[i]?.result

      switch (call.toolName) {
        case "ask_user":
          components.push({
            type: "question_card",
            data: {
              question: call.args.question,
              options: call.args.options,
              allow_multiple: call.args.allow_multiple,
            } satisfies QuestionCardData,
          })
          break

        case "render_draft_cards":
          if (result?.success && result.drafts) {
            components.push({
              type: "draft_grid",
              data: { drafts: result.drafts } satisfies DraftGridData,
            })
          }
          break

        case "confirm_and_persist":
          if (result) {
            components.push({
              type: "status_card",
              data: {
                success: result.success,
                title: result.success
                  ? "Products Created"
                  : "Some Products Failed",
                message: result.success
                  ? `Successfully created ${result.created_count} product(s).`
                  : `Created ${result.created_count}, failed ${result.failed_count}.`,
                details: result,
              } satisfies StatusCardData,
            })
          }
          break

        case "delegate_to_vision":
          if (result?.groups) {
            components.push({
              type: "question_card",
              data: {
                question: `I found ${result.total_groups} product group(s) from ${result.total_images} images. Are these grouped correctly?`,
                options: [
                  { label: "Yes, continue", value: "confirm_groups" },
                  { label: "Regroup", value: "regroup" },
                  { label: "Let me adjust", value: "manual_adjust" },
                ],
              } satisfies QuestionCardData,
            })
          }
          break

        case "delegate_to_product_intel":
          if (result?.drafts?.length > 0) {
            const draftIds = result.drafts
              .filter((d: any) => d?.draft_id)
              .map((d: any) => d.draft_id)

            if (draftIds.length > 0) {
              // Draft grid will be rendered by render_draft_cards call
              components.push({
                type: "confirmation_card",
                data: {
                  action: "approve_drafts",
                  description: `${draftIds.length} product draft(s) ready for review.`,
                  draft_ids: draftIds,
                  total_products: draftIds.length,
                } satisfies ConfirmationCardData,
              })
            }
          }
          break

        case "discard_drafts":
          if (result) {
            components.push({
              type: "status_card",
              data: {
                success: result.success,
                title: "Drafts Discarded",
                message: `${result.discarded_count} draft(s) discarded.`,
              } satisfies StatusCardData,
            })
          }
          break
      }
    }
  }

  return components
}
