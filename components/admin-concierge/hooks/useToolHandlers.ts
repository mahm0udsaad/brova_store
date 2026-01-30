"use client"

import { useCallback } from "react"
import type { UseAgentStreamReturn } from "@/hooks/use-agent-stream"
import type { ProductDraft } from "./useDraftState"

export interface ToolHandlersConfig {
  onAskUser?: (questionId: string, question: string, options: Array<{ label: string; value: string }>) => void
  onRenderDrafts?: (draftIds: string[], drafts: ProductDraft[]) => void
  onConfirmPersist?: (draftIds: string[]) => void
  onError?: (error: string) => void
}

/**
 * Hook to handle tool invocations from the agent
 * Routes tool results to appropriate UI callbacks
 */
export function useToolHandlers(agentStream: UseAgentStreamReturn, config: ToolHandlersConfig = {}) {
  const { onAskUser, onRenderDrafts, onConfirmPersist, onError } = config

  /**
   * Handle ask_user tool invocation
   * Shows question card and waits for user response
   */
  const handleAskUser = useCallback(
    (toolCallId: string, args: any) => {
      try {
        const { question, options } = args

        if (!question || !Array.isArray(options)) {
          throw new Error("Invalid ask_user tool arguments")
        }

        // Trigger UI to render question card
        if (onAskUser) {
          onAskUser(toolCallId, question, options)
        }

        // Note: User response is sent via agentStream.respondToQuestion(toolCallId, selectedValue)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error handling ask_user tool"
        if (onError) onError(message)
        console.error("Error in handleAskUser:", error)
      }
    },
    [onAskUser, onError]
  )

  /**
   * Handle render_draft_cards tool invocation
   * Shows draft grid with product cards
   */
  const handleRenderDrafts = useCallback(
    (toolCallId: string, args: any) => {
      try {
        const { draft_ids, drafts } = args

        if (!Array.isArray(draft_ids)) {
          throw new Error("Invalid render_draft_cards tool arguments")
        }

        // Trigger UI to render draft grid
        if (onRenderDrafts) {
          onRenderDrafts(draft_ids, drafts || [])
        }

        // User interactions are sent via:
        // - agentStream.requestEdit(draftId, field, instruction)
        // - agentStream.confirmDrafts(draftIds)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error handling render_draft_cards tool"
        if (onError) onError(message)
        console.error("Error in handleRenderDrafts:", error)
      }
    },
    [onRenderDrafts, onError]
  )

  /**
   * Handle confirm_and_persist tool invocation
   * Shows confirmation modal before saving
   */
  const handleConfirmPersist = useCallback(
    (toolCallId: string, args: any) => {
      try {
        const { draft_ids, product_count } = args

        if (!Array.isArray(draft_ids)) {
          throw new Error("Invalid confirm_and_persist tool arguments")
        }

        // Trigger UI to render confirmation modal
        if (onConfirmPersist) {
          onConfirmPersist(draft_ids)
        }

        // User confirmation is sent via agentStream (tool result handled automatically)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error handling confirm_and_persist tool"
        if (onError) onError(message)
        console.error("Error in handleConfirmPersist:", error)
      }
    },
    [onConfirmPersist, onError]
  )

  /**
   * Handle delegate_to_vision tool invocation
   * Shows progress card while vision analysis is running
   */
  const handleVisionAnalysis = useCallback((toolCallId: string, args: any) => {
    try {
      const { image_urls, batch_id } = args

      if (!Array.isArray(image_urls)) {
        throw new Error("Invalid delegate_to_vision tool arguments")
      }

      // UI shows ProgressCard with "Analyzing images..." message
      // Result will come via toolResult callback
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error handling vision analysis"
      if (onError) onError(message)
      console.error("Error in handleVisionAnalysis:", error)
    }
  }, [onError])

  /**
   * Handle delegate_to_product_intel tool invocation
   * Shows progress card while product generation is running
   */
  const handleProductGeneration = useCallback((toolCallId: string, args: any) => {
    try {
      const { image_groups, batch_id } = args

      if (!Array.isArray(image_groups)) {
        throw new Error("Invalid delegate_to_product_intel tool arguments")
      }

      // UI shows ProgressCard with "Generating products..." message
      // Result will come via toolResult callback
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error handling product generation"
      if (onError) onError(message)
      console.error("Error in handleProductGeneration:", error)
    }
  }, [onError])

  /**
   * Generic tool handler dispatcher
   * Routes based on tool name
   */
  const dispatchToolHandler = useCallback(
    (toolName: string, toolCallId: string, args: any) => {
      switch (toolName) {
        case "ask_user":
          return handleAskUser(toolCallId, args)
        case "render_draft_cards":
          return handleRenderDrafts(toolCallId, args)
        case "confirm_and_persist":
          return handleConfirmPersist(toolCallId, args)
        case "delegate_to_vision":
          return handleVisionAnalysis(toolCallId, args)
        case "delegate_to_product_intel":
          return handleProductGeneration(toolCallId, args)
        default:
          console.warn(`Unknown tool: ${toolName}`)
          return null
      }
    },
    [handleAskUser, handleRenderDrafts, handleConfirmPersist, handleVisionAnalysis, handleProductGeneration]
  )

  /**
   * Process all tool invocations in a message
   */
  const processToolInvocations = useCallback(
    (toolInvocations: any[]) => {
      if (!Array.isArray(toolInvocations)) return

      toolInvocations.forEach((invocation) => {
        const { toolCallId, toolName, args } = invocation
        if (toolCallId && toolName) {
          dispatchToolHandler(toolName, toolCallId, args)
        }
      })
    },
    [dispatchToolHandler]
  )

  return {
    handleAskUser,
    handleRenderDrafts,
    handleConfirmPersist,
    handleVisionAnalysis,
    handleProductGeneration,
    dispatchToolHandler,
    processToolInvocations,
  }
}
