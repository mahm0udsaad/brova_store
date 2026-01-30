/**
 * Workflow Stage Definitions
 * Maps each stage of the Workflow A (AI Onboarding Concierge) to:
 * - Stage name and description
 * - Generative UI component to render
 * - Agent tool to invoke
 * - Optional flag
 */

export interface WorkflowStage {
  stage: number
  name: string
  description: string
  generative_ui: "ProgressCard" | "QuestionCard" | "DraftGrid" | "BeforeAfterPreview" | "ConfirmationCard" | null
  agent_action: string | null
  optional?: boolean
}

export const ONBOARDING_WORKFLOW_STAGES: WorkflowStage[] = [
  {
    stage: 1,
    name: "image_upload",
    description: "User uploads product images",
    generative_ui: null,
    agent_action: null,
  },
  {
    stage: 2,
    name: "vision_analysis",
    description: "Vision Agent groups images by similarity",
    generative_ui: "ProgressCard",
    agent_action: "delegate_to_vision",
  },
  {
    stage: 3,
    name: "group_confirmation",
    description: "User reviews and confirms image grouping",
    generative_ui: "QuestionCard",
    agent_action: "ask_user",
  },
  {
    stage: 4,
    name: "product_generation",
    description: "Product Intel Agent generates bilingual drafts",
    generative_ui: "ProgressCard",
    agent_action: "delegate_to_product_intel",
  },
  {
    stage: 5,
    name: "draft_preview",
    description: "User reviews draft products in grid",
    generative_ui: "DraftGrid",
    agent_action: "render_draft_cards",
  },
  {
    stage: 6,
    name: "draft_editing",
    description: "Optional: User edits individual drafts",
    generative_ui: "BeforeAfterPreview",
    agent_action: "delegate_to_editor",
    optional: true,
  },
  {
    stage: 7,
    name: "persistence",
    description: "User approves and drafts are saved to database",
    generative_ui: "ConfirmationCard",
    agent_action: "confirm_and_persist",
  },
]

export const getWorkflowStageByNumber = (stageNumber: number): WorkflowStage | undefined => {
  return ONBOARDING_WORKFLOW_STAGES.find((s) => s.stage === stageNumber)
}

export const getWorkflowStageName = (stageNumber: number): string => {
  return getWorkflowStageByNumber(stageNumber)?.name || "unknown"
}

export const getTotalWorkflowStages = (): number => {
  return ONBOARDING_WORKFLOW_STAGES.length
}

export const isStageOptional = (stageNumber: number): boolean => {
  const stage = getWorkflowStageByNumber(stageNumber)
  return stage?.optional ?? false
}
