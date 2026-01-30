"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface WorkflowState {
  id: string
  conversation_id: string
  merchant_id: string
  workflow_type: "onboarding" | "bulk_image_to_products" | "product_edit" | "marketing_campaign" | "bulk_edit"
  current_stage: number
  total_stages: number
  stage_data: Record<string, any>
  status: "in_progress" | "paused" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  completed_at?: string
}

/**
 * Hook to manage workflow state stored in database (ai_workflow_state table)
 * Enables workflow resumption after interruptions
 */
export function useWorkflowState(conversationId: string | null) {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Create a new workflow state
   */
  const createWorkflow = useCallback(
    async (params: {
      workflow_type: WorkflowState["workflow_type"]
      total_stages: number
      stage_data?: Record<string, any>
    }) => {
      if (!conversationId) {
        setError("Conversation ID is required")
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user?.user?.id) {
          setError("User not authenticated")
          return null
        }

        const newWorkflowState = {
          conversation_id: conversationId,
          merchant_id: user.user.id,
          workflow_type: params.workflow_type,
          current_stage: 1,
          total_stages: params.total_stages,
          stage_data: params.stage_data || {},
          status: "in_progress",
        }

        const { data, error: dbError } = await supabase
          .from("ai_workflow_state")
          .insert([newWorkflowState])
          .select()
          .single()

        if (dbError) throw dbError

        setWorkflowState(data as WorkflowState)
        return data as WorkflowState
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create workflow"
        setError(message)
        console.error("Error creating workflow state:", err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, supabase]
  )

  /**
   * Load existing workflow state by conversation ID
   */
  const loadWorkflow = useCallback(async () => {
    if (!conversationId) return null

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from("ai_workflow_state")
        .select("*")
        .eq("conversation_id", conversationId)
        .single()

      if (dbError && dbError.code !== "PGRST116") {
        // PGRST116 is "no rows" - this is expected if no workflow exists yet
        throw dbError
      }

      if (data) {
        setWorkflowState(data as WorkflowState)
        return data as WorkflowState
      }

      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load workflow"
      setError(message)
      console.error("Error loading workflow state:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, supabase])

  /**
   * Advance to next stage and update stage data
   */
  const advanceStage = useCallback(
    async (stageData?: Record<string, any>) => {
      if (!workflowState) {
        setError("No active workflow")
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const newStage = Math.min(workflowState.current_stage + 1, workflowState.total_stages)
        const newStageData = stageData ? { ...workflowState.stage_data, ...stageData } : workflowState.stage_data

        const { data, error: dbError } = await supabase
          .from("ai_workflow_state")
          .update({
            current_stage: newStage,
            stage_data: newStageData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workflowState.id)
          .select()
          .single()

        if (dbError) throw dbError

        const updatedState = data as WorkflowState
        setWorkflowState(updatedState)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to advance stage"
        setError(message)
        console.error("Error advancing workflow stage:", err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [workflowState, supabase]
  )

  /**
   * Update stage data without advancing
   */
  const updateStageData = useCallback(
    async (stageData: Record<string, any>) => {
      if (!workflowState) {
        setError("No active workflow")
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const newStageData = { ...workflowState.stage_data, ...stageData }

        const { data, error: dbError } = await supabase
          .from("ai_workflow_state")
          .update({
            stage_data: newStageData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workflowState.id)
          .select()
          .single()

        if (dbError) throw dbError

        const updatedState = data as WorkflowState
        setWorkflowState(updatedState)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update stage data"
        setError(message)
        console.error("Error updating stage data:", err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [workflowState, supabase]
  )

  /**
   * Pause workflow
   */
  const pauseWorkflow = useCallback(async () => {
    if (!workflowState) return false

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from("ai_workflow_state")
        .update({
          status: "paused",
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflowState.id)
        .select()
        .single()

      if (dbError) throw dbError

      setWorkflowState(data as WorkflowState)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to pause workflow"
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [workflowState, supabase])

  /**
   * Resume paused workflow
   */
  const resumeWorkflow = useCallback(async () => {
    if (!workflowState) return false

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from("ai_workflow_state")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflowState.id)
        .select()
        .single()

      if (dbError) throw dbError

      setWorkflowState(data as WorkflowState)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resume workflow"
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [workflowState, supabase])

  /**
   * Complete workflow
   */
  const completeWorkflow = useCallback(async () => {
    if (!workflowState) return false

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from("ai_workflow_state")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", workflowState.id)
        .select()
        .single()

      if (dbError) throw dbError

      setWorkflowState(data as WorkflowState)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete workflow"
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [workflowState, supabase])

  /**
   * Cancel workflow
   */
  const cancelWorkflow = useCallback(async () => {
    if (!workflowState) return false

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from("ai_workflow_state")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflowState.id)
        .select()
        .single()

      if (dbError) throw dbError

      setWorkflowState(null)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel workflow"
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [workflowState, supabase])

  /**
   * Get progress percentage
   */
  const getProgress = useCallback(() => {
    if (!workflowState) return 0
    return Math.round((workflowState.current_stage / workflowState.total_stages) * 100)
  }, [workflowState])

  /**
   * Check if workflow is at final stage
   */
  const isAtFinalStage = useCallback(() => {
    if (!workflowState) return false
    return workflowState.current_stage === workflowState.total_stages
  }, [workflowState])

  return {
    workflowState,
    isLoading,
    error,
    createWorkflow,
    loadWorkflow,
    advanceStage,
    updateStageData,
    pauseWorkflow,
    resumeWorkflow,
    completeWorkflow,
    cancelWorkflow,
    getProgress,
    isAtFinalStage,
  }
}
