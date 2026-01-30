"use client"

import { useState, useCallback, useRef } from "react"
import type { Message, StepUpdate } from "@/components/admin/ai-sidebar"

interface StreamResponse {
  type: "step" | "response" | "error" | "complete"
  data?: any
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const streamMessage = useCallback(
    async (
      content: string,
      images?: string[],
      onMessage?: (message: Message) => void,
      onComplete?: () => void
    ) => {
      // Abort any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setIsStreaming(true)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        steps: [],
        thinking: true,
      }

      setCurrentMessage(assistantMessage)
      onMessage?.(assistantMessage)

      try {
        const response = await fetch("/api/admin/assistant/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request: content,
            images,
            context: {
              // Context will be built from page state
              page: window.location.pathname,
            },
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.substring(6)
              if (data === "[DONE]") {
                break
              }

              try {
                const parsed: StreamResponse = JSON.parse(data)

                if (parsed.type === "step") {
                  const step = parsed.data as StepUpdate
                  assistantMessage.steps = [...(assistantMessage.steps || []), step]
                  setCurrentMessage({ ...assistantMessage })
                  onMessage?.({ ...assistantMessage })
                } else if (parsed.type === "response") {
                  assistantMessage.content = parsed.data.response || ""
                  assistantMessage.thinking = false
                  setCurrentMessage({ ...assistantMessage })
                  onMessage?.({ ...assistantMessage })
                } else if (parsed.type === "error") {
                  assistantMessage.content = `Error: ${parsed.data.error}`
                  assistantMessage.thinking = false
                  setCurrentMessage({ ...assistantMessage })
                  onMessage?.({ ...assistantMessage })
                } else if (parsed.type === "complete") {
                  assistantMessage.thinking = false
                  setCurrentMessage({ ...assistantMessage })
                  onMessage?.({ ...assistantMessage })
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e)
              }
            }
          }
        }

        onComplete?.()
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Stream aborted")
        } else {
          console.error("Stream error:", error)
          const errorMessage: Message = {
            ...assistantMessage,
            content: "Sorry, I encountered an error processing your request.",
            thinking: false,
          }
          setCurrentMessage(errorMessage)
          onMessage?.(errorMessage)
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    []
  )

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }, [])

  return {
    streamMessage,
    cancelStream,
    isStreaming,
    currentMessage,
  }
}
