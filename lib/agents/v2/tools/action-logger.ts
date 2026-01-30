/**
 * Action Logger - Automatic tracking of all AI tool executions
 *
 * Wraps tool execute functions to log to ai_actions_log table.
 * Provides audit trail, debugging, and monitoring capabilities.
 */
import { createAdminClient } from "@/lib/supabase/admin"

interface ActionLogEntry {
  conversation_id?: string
  merchant_id: string
  action_type: string
  tool_name?: string
  agent_name?: string
  input: any
  output?: any
  status: "pending" | "success" | "failed" | "cancelled"
  error?: string
  duration_ms?: number
}

/**
 * Log an action to the ai_actions_log table
 */
export async function logAction(entry: ActionLogEntry): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("ai_actions_log")
      .insert({
        conversation_id: entry.conversation_id || null,
        merchant_id: entry.merchant_id,
        action_type: entry.action_type,
        tool_name: entry.tool_name || null,
        agent_name: entry.agent_name || null,
        input: entry.input,
        output: entry.output || null,
        status: entry.status,
        error: entry.error || null,
        duration_ms: entry.duration_ms || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to log action:", error)
      return null
    }

    return data.id
  } catch (err) {
    console.error("Action logger error:", err)
    return null
  }
}

/**
 * Update an existing action log entry
 */
export async function updateActionLog(
  logId: string,
  updates: {
    output?: any
    status?: "pending" | "success" | "failed" | "cancelled"
    error?: string
    duration_ms?: number
  }
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin
      .from("ai_actions_log")
      .update(updates)
      .eq("id", logId)
  } catch (err) {
    console.error("Failed to update action log:", err)
  }
}

/**
 * Wrap a tool execute function with automatic logging
 *
 * Usage:
 * ```ts
 * const myTool = tool({
 *   description: "...",
 *   parameters: z.object({...}),
 *   execute: withActionLogging(
 *     "my_tool",
 *     async (params, context) => {
 *       // tool logic here
 *       return { success: true }
 *     }
 *   )
 * })
 * ```
 */
export function withActionLogging<TInput extends Record<string, any>, TOutput>(
  toolName: string,
  executeFn: (input: TInput, context?: { conversation_id?: string; merchant_id: string }) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    // Extract context from input if available
    const context = {
      merchant_id: (input as any).merchant_id,
      conversation_id: (input as any).conversation_id,
    }

    if (!context.merchant_id) {
      // If no merchant_id in input, execute without logging
      return executeFn(input, context)
    }

    const startTime = Date.now()

    // Create pending log entry
    const logId = await logAction({
      conversation_id: context.conversation_id,
      merchant_id: context.merchant_id,
      action_type: "tool_call",
      tool_name: toolName,
      input,
      status: "pending",
    })

    try {
      // Execute the tool
      const result = await executeFn(input, context)
      const duration = Date.now() - startTime

      // Update log with success
      if (logId) {
        await updateActionLog(logId, {
          output: result,
          status: "success",
          duration_ms: duration,
        })
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Update log with failure
      if (logId) {
        await updateActionLog(logId, {
          status: "failed",
          error: errorMessage,
          duration_ms: duration,
        })
      }

      throw error
    }
  }
}

/**
 * Log an agent delegation
 */
export async function logAgentDelegation(params: {
  conversation_id?: string
  merchant_id: string
  agent_name: string
  input: any
}): Promise<string | null> {
  return logAction({
    conversation_id: params.conversation_id,
    merchant_id: params.merchant_id,
    action_type: "agent_delegation",
    agent_name: params.agent_name,
    input: params.input,
    status: "pending",
  })
}

/**
 * Log a user confirmation event
 */
export async function logUserConfirmation(params: {
  conversation_id?: string
  merchant_id: string
  action: string
  confirmed: boolean
  details?: any
}): Promise<string | null> {
  return logAction({
    conversation_id: params.conversation_id,
    merchant_id: params.merchant_id,
    action_type: "user_confirmation",
    input: { action: params.action, details: params.details },
    output: { confirmed: params.confirmed },
    status: "success",
  })
}

/**
 * Log a database write operation
 */
export async function logDatabaseWrite(params: {
  conversation_id?: string
  merchant_id: string
  table: string
  operation: "insert" | "update" | "delete"
  record_ids: string[]
  success: boolean
  error?: string
}): Promise<string | null> {
  return logAction({
    conversation_id: params.conversation_id,
    merchant_id: params.merchant_id,
    action_type: "db_write",
    input: { table: params.table, operation: params.operation, record_ids: params.record_ids },
    status: params.success ? "success" : "failed",
    error: params.error,
  })
}
