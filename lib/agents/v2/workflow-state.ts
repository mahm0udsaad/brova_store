/**
 * Workflow State Management
 *
 * Enables multi-step workflows to be paused and resumed.
 * Tracks progress through stages and persists state to database.
 */
import { createAdminClient } from "@/lib/supabase/admin"

export type WorkflowType =
  | "onboarding"
  | "bulk_image_to_products"
  | "product_edit"
  | "marketing_campaign"
  | "bulk_edit"

export type WorkflowStatus = "in_progress" | "paused" | "completed" | "cancelled"

export interface WorkflowState {
  id: string
  conversation_id: string
  merchant_id: string
  workflow_type: WorkflowType
  current_stage: number
  total_stages: number
  stage_data: Record<string, any>
  status: WorkflowStatus
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface WorkflowStageData {
  stage_name?: string
  batch_id?: string
  draft_ids?: string[]
  product_ids?: string[]
  image_groups?: any[]
  user_selections?: any
  [key: string]: any
}

/**
 * Create a new workflow state
 */
export async function createWorkflowState(params: {
  conversation_id: string
  merchant_id: string
  workflow_type: WorkflowType
  total_stages: number
  initial_data?: WorkflowStageData
}): Promise<WorkflowState | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("ai_workflow_state")
      .insert({
        conversation_id: params.conversation_id,
        merchant_id: params.merchant_id,
        workflow_type: params.workflow_type,
        current_stage: 1,
        total_stages: params.total_stages,
        stage_data: params.initial_data || {},
        status: "in_progress",
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create workflow state:", error)
      return null
    }

    return data as WorkflowState
  } catch (err) {
    console.error("Workflow state creation error:", err)
    return null
  }
}

/**
 * Get workflow state by conversation ID
 */
export async function getWorkflowState(
  conversationId: string
): Promise<WorkflowState | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("ai_workflow_state")
      .select()
      .eq("conversation_id", conversationId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return data as WorkflowState
  } catch (err) {
    console.error("Failed to get workflow state:", err)
    return null
  }
}

/**
 * Update workflow state - advance to next stage
 */
export async function advanceWorkflowStage(
  workflowId: string,
  stageData: WorkflowStageData
): Promise<boolean> {
  try {
    const admin = createAdminClient()

    // Get current state
    const { data: current, error: fetchError } = await admin
      .from("ai_workflow_state")
      .select()
      .eq("id", workflowId)
      .single()

    if (fetchError || !current) {
      console.error("Failed to fetch workflow state:", fetchError)
      return false
    }

    const nextStage = current.current_stage + 1
    const isComplete = nextStage > current.total_stages

    // Update state
    const { error: updateError } = await admin
      .from("ai_workflow_state")
      .update({
        current_stage: isComplete ? current.total_stages : nextStage,
        stage_data: { ...(current.stage_data as Record<string, any> || {}), ...stageData },
        status: isComplete ? "completed" : "in_progress",
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    if (updateError) {
      console.error("Failed to update workflow state:", updateError)
      return false
    }

    return true
  } catch (err) {
    console.error("Workflow stage advance error:", err)
    return false
  }
}

/**
 * Update workflow data without advancing stage
 */
export async function updateWorkflowData(
  workflowId: string,
  stageData: WorkflowStageData
): Promise<boolean> {
  try {
    const admin = createAdminClient()

    // Get current stage_data
    const { data: current } = await admin
      .from("ai_workflow_state")
      .select("stage_data")
      .eq("id", workflowId)
      .single()

    const { error } = await admin
      .from("ai_workflow_state")
      .update({
        stage_data: { ...(current?.stage_data as Record<string, any> || {}), ...stageData },
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    if (error) {
      console.error("Failed to update workflow data:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Workflow data update error:", err)
    return false
  }
}

/**
 * Pause a workflow (user can resume later)
 */
export async function pauseWorkflow(workflowId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_workflow_state")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    if (error) {
      console.error("Failed to pause workflow:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Workflow pause error:", err)
    return false
  }
}

/**
 * Resume a paused workflow
 */
export async function resumeWorkflow(workflowId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_workflow_state")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    if (error) {
      console.error("Failed to resume workflow:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Workflow resume error:", err)
    return false
  }
}

/**
 * Cancel a workflow
 */
export async function cancelWorkflow(workflowId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_workflow_state")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    if (error) {
      console.error("Failed to cancel workflow:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Workflow cancel error:", err)
    return false
  }
}

/**
 * Get workflow progress summary
 */
export function getWorkflowProgress(state: WorkflowState): {
  percentage: number
  currentStage: number
  totalStages: number
  isComplete: boolean
} {
  const percentage = Math.round((state.current_stage / state.total_stages) * 100)
  return {
    percentage,
    currentStage: state.current_stage,
    totalStages: state.total_stages,
    isComplete: state.status === "completed",
  }
}

/**
 * Workflow stage definitions for common workflows
 */
export const WORKFLOW_STAGES = {
  bulk_image_to_products: {
    total: 7,
    stages: [
      { stage: 1, name: "Image Upload", description: "Upload images to Supabase Storage" },
      { stage: 2, name: "Vision Analysis", description: "Group images by similarity" },
      { stage: 3, name: "Group Confirmation", description: "User reviews grouping" },
      { stage: 4, name: "Product Generation", description: "Generate bilingual drafts" },
      { stage: 5, name: "Draft Preview", description: "User reviews drafts" },
      { stage: 6, name: "Draft Editing", description: "User edits drafts (optional)" },
      { stage: 7, name: "Persistence", description: "Save to store_products" },
    ],
  },
  onboarding: {
    total: 7,
    stages: [
      { stage: 1, name: "Authentication", description: "User login/signup" },
      { stage: 2, name: "Store Type", description: "Select store type" },
      { stage: 3, name: "Theme Setup", description: "Choose theme" },
      { stage: 4, name: "Branding", description: "Logo and colors" },
      { stage: 5, name: "Payment", description: "Payment method setup" },
      { stage: 6, name: "Initial Products", description: "Upload first products" },
      { stage: 7, name: "Completion", description: "Redirect to dashboard" },
    ],
  },
  product_edit: {
    total: 5,
    stages: [
      { stage: 1, name: "Product Selection", description: "Select product to edit" },
      { stage: 2, name: "Edit Intent", description: "Parse user edit request" },
      { stage: 3, name: "Edit Execution", description: "Apply changes" },
      { stage: 4, name: "Preview", description: "Show before/after" },
      { stage: 5, name: "Confirmation", description: "Save changes" },
    ],
  },
} as const
