"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export type AICommand =
  | { type: "navigate"; path: string }
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; value: string }
  | { type: "select_image"; imageId: string }
  | { type: "trigger_action"; action: string; params: Record<string, any> }
  | { type: "show_toast"; message: string; variant: "success" | "error" | "info" }
  | { type: "open_modal"; modalType: string; data?: any }
  | { type: "refresh_data"; dataType: string }

interface AICommandRecord {
  id: string
  merchant_id: string
  command: AICommand
  status: "pending" | "executing" | "completed" | "failed"
  result?: any
  error?: string
  created_at: string
}

interface UseAICommandsOptions {
  onCommandExecuted?: (command: AICommand, result: any) => void
  onCommandFailed?: (command: AICommand, error: string) => void
}

export function useAICommands(options?: UseAICommandsOptions) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const executingCommands = useRef(new Set<string>())

  const executeCommand = useCallback(
    async (commandRecord: AICommandRecord) => {
      // Prevent duplicate execution
      if (executingCommands.current.has(commandRecord.id)) {
        return
      }

      executingCommands.current.add(commandRecord.id)
      const supabase = supabaseRef.current
      const command = commandRecord.command

      try {
        // Update status to executing
        await supabase
          .from("ai_commands")
          .update({ status: "executing", executed_at: new Date().toISOString() })
          .eq("id", commandRecord.id)

        let result: any = null

        // Execute the command based on type
        switch (command.type) {
          case "navigate":
            // Defer navigation to avoid updating Router during render
            setTimeout(() => {
              router.push(command.path)
            }, 0)
            result = { navigated: true, path: command.path }
            break

          case "click":
            const clickElement = document.querySelector(command.selector)
            if (clickElement instanceof HTMLElement) {
              clickElement.click()
              result = { clicked: true, selector: command.selector }
            } else {
              throw new Error(`Element not found: ${command.selector}`)
            }
            break

          case "fill":
            const fillElement = document.querySelector(command.selector)
            if (fillElement instanceof HTMLInputElement || fillElement instanceof HTMLTextAreaElement) {
              fillElement.value = command.value
              fillElement.dispatchEvent(new Event("input", { bubbles: true }))
              fillElement.dispatchEvent(new Event("change", { bubbles: true }))
              result = { filled: true, selector: command.selector, value: command.value }
            } else {
              throw new Error(`Input element not found: ${command.selector}`)
            }
            break

          case "select_image":
            // Dispatch custom event for image selection
            window.dispatchEvent(
              new CustomEvent("ai-select-image", { detail: { imageId: command.imageId } })
            )
            result = { selected: true, imageId: command.imageId }
            break

          case "trigger_action":
            // Handle specific actions
            if (command.action === "start_bulk_processing") {
              window.dispatchEvent(
                new CustomEvent("ai-start-bulk-processing", {
                  detail: {
                    imageUrls: command.params?.imageUrls || [],
                    operations: command.params?.operations || [],
                  },
                })
              )
            } else {
              // Dispatch generic custom event for other actions
              window.dispatchEvent(
                new CustomEvent("ai-trigger-action", {
                  detail: { action: command.action, params: command.params },
                })
              )
            }
            result = { triggered: true, action: command.action }
            break

          case "show_toast":
            // Dispatch custom event for showing toast
            window.dispatchEvent(
              new CustomEvent("ai-show-toast", {
                detail: { message: command.message, variant: command.variant },
              })
            )
            result = { shown: true, message: command.message }
            break

          case "open_modal":
            // Dispatch custom event for opening modals
            window.dispatchEvent(
              new CustomEvent("ai-open-modal", {
                detail: { modalType: command.modalType, data: command.data },
              })
            )
            result = { opened: true, modalType: command.modalType }
            break

          case "refresh_data":
            // Dispatch custom event for refreshing data
            window.dispatchEvent(
              new CustomEvent("ai-refresh-data", {
                detail: { dataType: command.dataType },
              })
            )
            result = { refreshed: true, dataType: command.dataType }
            break

          default:
            throw new Error(`Unknown command type: ${(command as any).type}`)
        }

        // Update status to completed
        await supabase
          .from("ai_commands")
          .update({
            status: "completed",
            result,
            completed_at: new Date().toISOString(),
          })
          .eq("id", commandRecord.id)

        if (options?.onCommandExecuted) {
          options.onCommandExecuted(command, result)
        }
      } catch (error) {
        console.error("Command execution failed:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        // Update status to failed
        await supabase
          .from("ai_commands")
          .update({
            status: "failed",
            error: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq("id", commandRecord.id)

        if (options?.onCommandFailed) {
          options.onCommandFailed(command, errorMessage)
        }
      } finally {
        executingCommands.current.delete(commandRecord.id)
      }
    },
    [router, options]
  )

  useEffect(() => {
    const supabase = supabaseRef.current

    // Subscribe to new commands
    const channel = supabase
      .channel("ai-commands")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_commands",
          filter: `status=eq.pending`,
        },
        (payload: any) => {
          const commandRecord = payload.new as AICommandRecord
          executeCommand(commandRecord)
        }
      )
      .subscribe()

    // Check for any pending commands on mount
    const checkPendingCommands = async () => {
      const { data: pendingCommands } = await supabase
        .from("ai_commands")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })

      if (pendingCommands) {
        for (const command of pendingCommands) {
          await executeCommand(command as AICommandRecord)
        }
      }
    }

    checkPendingCommands()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [executeCommand])

  return {
    // Expose method to manually create commands if needed
    createCommand: useCallback(
      async (command: AICommand) => {
        const supabase = supabaseRef.current
        const { data, error } = await supabase
          .from("ai_commands")
          .insert({
            command,
            status: "pending",
          })
          .select()
          .single()

        if (error) throw error
        return data
      },
      []
    ),
  }
}
