"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react"
import { AdminAssistantFab } from "./AdminAssistantFab"
import { AdminAssistantPanel } from "./AdminAssistantPanel"
import { AdminAssistantSidePanel } from "./AdminAssistantSidePanel"
import { useAICommands } from "@/hooks/use-ai-commands"

export type AssistantDisplayMode = "collapsed" | "panel" | "side-panel"

// UI Command interface for client-side execution
interface UICommand {
  type: string
  action?: string
  path?: string
  message?: string
  variant?: string
  params?: Record<string, any>
  [key: string]: any
}

export interface PageContext {
  pageName: string
  pageType: "dashboard" | "products" | "orders" | "media" | "marketing" | "bulk-deals" | "insights" | "appearance" | "settings"
  selectedItems: string[]
  filters: Record<string, any>
  capabilities: string[]
  // Available images that the user has uploaded or processed on this page
  availableImages?: string[]
  // Additional context data (e.g., processed results, batch info)
  contextData?: Record<string, any>
}

export interface BulkProgressData {
  operationId: string
  operationLabel: string
  current: number
  total: number
  item: { id: string; name: string; status: "pending" | "updating" | "done" | "failed"; error?: string }
  completedItems: Array<{ id: string; name: string; status: "done" | "failed"; error?: string }>
}

export interface StepUpdate {
  type: "planning" | "executing" | "synthesizing" | "complete"
  step?: number
  totalSteps?: number
  agentName?: string
  action?: string
  message: string
  data?: any
  bulkProgress?: BulkProgressData
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  toolInvocations?: any[]
  images?: string[] // Base64 encoded images
  steps?: StepUpdate[] // Thinking process visualization
  bulkProgress?: BulkProgressData // Latest bulk progress state
  isThinking?: boolean // Whether the message is still being processed
  isError?: boolean // Whether the message is an error
  retryable?: boolean // Whether the message can be retried
}

interface AdminAssistantContextType {
  displayMode: AssistantDisplayMode
  setDisplayMode: (mode: AssistantDisplayMode) => void
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  messages: Message[]
  sendMessage: (content: string, images?: string[]) => Promise<void>
  isLoading: boolean
  pageContext: PageContext | null
  setPageContext: (context: PageContext | null) => void
  screenshotCount: number
  maxScreenshots: number
  // AI activity tracking for background processes
  isGenerating: boolean
  currentActivity: string | null
  currentAgent: string | null
}

const AdminAssistantContext = createContext<AdminAssistantContextType | null>(null)

export function useAdminAssistant() {
  const context = useContext(AdminAssistantContext)
  if (!context) {
    throw new Error("useAdminAssistant must be used within AdminAssistantProvider")
  }
  return context
}

interface AdminAssistantProviderProps {
  children: ReactNode
}

export function AdminAssistantProvider({ children }: AdminAssistantProviderProps) {
  const [displayMode, setDisplayMode] = useState<AssistantDisplayMode>("collapsed")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI Manager Assistant. 👋\n\nI can help you:\n• **Create products** from images\n• **Generate marketing content** and captions\n• **Process images** in bulk (remove backgrounds, create lifestyle shots)\n• **Analyze sales data** and insights\n• **Automate workflows** and tasks\n• **Update product inventory and stock quantities**\n\nWhat would you like to work on today?",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(true)
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const maxScreenshots = 5

  // Track uploaded images in this conversation session for follow-up messages
  const [conversationImages, setConversationImages] = useState<string[]>([])

  // Track AI activity for background processes (e.g., image generation)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<string | null>(null)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)

  // Enable AI commands for real-time UI control
  useAICommands({
    onCommandExecuted: (command, result) => {
      console.log("AI command executed:", command, result)
    },
    onCommandFailed: (command, error) => {
      console.error("AI command failed:", command, error)
    },
  })

  // Load conversation history on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const response = await fetch("/api/admin/assistant/conversation")
        if (response.ok) {
          const data = await response.json()
          if (data.conversation && data.messages.length > 0) {
            setConversationId(data.conversation.id)
            // Convert database messages to Message type
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
              images: msg.images || undefined,
              steps: msg.steps || undefined,
              isThinking: msg.thinking || false,
              toolInvocations: msg.metadata?.toolInvocations,
              isError: msg.metadata?.isError,
              retryable: msg.metadata?.retryable,
            }))
            setMessages(loadedMessages)
          }
        }
      } catch (error) {
        console.error("Failed to load conversation:", error)
      } finally {
        setIsLoadingConversation(false)
      }
    }

    loadConversation()
  }, [])

  // Save new messages to database (debounced)
  useEffect(() => {
    // Skip saving if still loading or no real messages
    if (isLoadingConversation || messages.length === 0) return

    // Skip if only welcome message
    if (messages.length === 1 && messages[0].id === "welcome") return

    // Debounce saving
    const timeoutId = setTimeout(async () => {
      try {
        // Only save user and assistant messages (not thinking/temporary messages)
        const messagesToSave = messages.filter(
          (msg) => !msg.id.startsWith("thinking-") && msg.id !== "welcome"
        )

        if (messagesToSave.length === 0) return

        await fetch("/api/admin/assistant/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            messages: messagesToSave.slice(-2), // Only save the last 2 messages to avoid duplicates
            title: "AI Manager Conversation",
          }),
        })
      } catch (error) {
        console.error("Failed to save conversation:", error)
      }
    }, 1000) // Wait 1 second after last message before saving

    return () => clearTimeout(timeoutId)
  }, [messages, conversationId, isLoadingConversation])

  const isOpen = displayMode !== "collapsed"

  const open = useCallback(() => {
    setDisplayMode("panel")
  }, [])

  const close = useCallback(() => {
    setDisplayMode("collapsed")
  }, [])

  const toggle = useCallback(() => {
    setDisplayMode((prev) => (prev === "collapsed" ? "panel" : "collapsed"))
  }, [])

  /**
   * Execute UI commands received from the AI assistant
   * These commands trigger client-side actions like showing toasts,
   * opening modals, navigating, or triggering bulk processing
   */
  const executeUICommands = useCallback((commands: UICommand[]) => {
    for (const command of commands) {
      try {
        switch (command.type) {
          case "trigger_action":
            // Dispatch custom events for specific actions
            if (command.action === "start_bulk_processing") {
              window.dispatchEvent(
                new CustomEvent("ai-start-bulk-processing", {
                  detail: command.params,
                })
              )
            } else if (command.action === "update_processing_results") {
              window.dispatchEvent(
                new CustomEvent("ai-processing-results", {
                  detail: command.params,
                })
              )
            } else if (command.action === "generate_showcase") {
              window.dispatchEvent(
                new CustomEvent("ai-generate-showcase", {
                  detail: command.params,
                })
              )
            } else if (command.action === "upload_images") {
              window.dispatchEvent(
                new CustomEvent("ai-upload-images", {
                  detail: command.params,
                })
              )
            }
            break

          case "show_toast":
            window.dispatchEvent(
              new CustomEvent("ai-show-toast", {
                detail: {
                  message: command.message,
                  variant: command.variant || "info",
                },
              })
            )
            break

          case "navigate":
            if (command.path) {
              window.dispatchEvent(
                new CustomEvent("ai-navigate", {
                  detail: { path: command.path },
                })
              )
            }
            break

          case "open_modal":
            window.dispatchEvent(
              new CustomEvent("ai-open-modal", {
                detail: {
                  modalType: command.modalType,
                  data: command.data,
                },
              })
            )
            break

          case "refresh_data":
            window.dispatchEvent(
              new CustomEvent("ai-refresh-data", {
                detail: { dataType: command.dataType },
              })
            )
            break

          case "select_image":
            window.dispatchEvent(
              new CustomEvent("ai-select-image", {
                detail: { imageId: command.imageId },
              })
            )
            break

          default:
            console.log("Unknown UI command type:", command.type)
        }
      } catch (error) {
        console.error("Failed to execute UI command:", command, error)
      }
    }
  }, [])

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      images: images && images.length > 0 ? images : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Add a thinking placeholder message with real-time steps
    const thinkingId = `thinking-${Date.now()}`
    const thinkingMessage: Message = {
      id: thinkingId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isThinking: true,
      steps: [],
    }
    setMessages((prev) => [...prev, thinkingMessage])

    try {
      // Determine which images to send:
      // 1. New images if provided
      // 2. Otherwise, use conversation images from previous uploads
      // 3. Or use available images from page context
      const imagesToSend = images && images.length > 0 
        ? images 
        : undefined
      
      // Include conversation image URLs in page context for the AI to reference
      const enhancedPageContext = pageContext ? {
        ...pageContext,
        availableImages: [
          ...(pageContext.availableImages || []),
          ...conversationImages,
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        contextData: {
          ...pageContext.contextData,
          conversationImages: conversationImages.length > 0 ? conversationImages : undefined,
        },
      } : null

      // Use the streaming endpoint for real-time updates
      const response = await fetch("/api/admin/assistant/stream", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          pageContext: enhancedPageContext,
          images: imagesToSend,
          // Also send stored image URLs for reference (when no new images attached)
          storedImageUrls: !imagesToSend && conversationImages.length > 0 ? conversationImages : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Streaming API error:", response.status, errorData)
        
        let userFriendlyError = "I'm sorry, I encountered an error. Please try again."
        if (response.status === 401) {
          userFriendlyError = "Your session has expired. Please refresh the page and log in again."
        } else if (response.status === 403) {
          userFriendlyError = "You don't have permission to access the AI assistant. Please contact support."
        }
        throw new Error(userFriendlyError)
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      let finalResponse: any = null
      const currentSteps: StepUpdate[] = []

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages (separated by double newlines)
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || "" // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6) // Remove "data: " prefix
              const message = JSON.parse(jsonStr)

              switch (message.type) {
                case "step":
                  // Only add non-bulk-progress steps to timeline (avoid flooding)
                  if (!message.data.bulkProgress) {
                    currentSteps.push(message.data)
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === thinkingId
                        ? {
                            ...m,
                            steps: [...currentSteps],
                            // Attach latest bulk progress to message
                            bulkProgress: message.data.bulkProgress || m.bulkProgress,
                          }
                        : m
                    )
                  )
                  
                  // Track AI activity for background processes
                  if (message.data.type === "executing") {
                    setIsGenerating(true)
                    setCurrentActivity(message.data.message || null)
                    setCurrentAgent(message.data.agentName || null)
                  } else if (message.data.type === "complete") {
                    setIsGenerating(false)
                    setCurrentActivity(null)
                    setCurrentAgent(null)
                  }
                  
                  // Execute UI command immediately if present in step update
                  if (message.data.uiCommand) {
                    executeUICommands([message.data.uiCommand])
                  }
                  // Capture uploaded image URLs for future reference
                  if (message.data.data?.imageUrls && Array.isArray(message.data.data.imageUrls)) {
                    setConversationImages((prev) => {
                      const newUrls = message.data.data.imageUrls.filter(
                        (url: string) => !prev.includes(url)
                      )
                      return [...prev, ...newUrls]
                    })
                  }
                  break

                case "response":
                  finalResponse = message.data
                  break

                case "error":
                  throw new Error(message.data.details || message.data.error || "Unknown error")

                case "done":
                  // Stream complete
                  break
              }
            } catch (parseError) {
              console.error("Failed to parse SSE message:", parseError, line)
            }
          }
        }
      }

      // Capture bulk progress from thinking message before removing it
      let lastBulkProgress: BulkProgressData | undefined
      setMessages((prev) => {
        const thinkingMsg = prev.find((m) => m.id === thinkingId)
        lastBulkProgress = thinkingMsg?.bulkProgress
        return prev.filter((m) => m.id !== thinkingId)
      })

      if (finalResponse) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: finalResponse.content || finalResponse.message || "I apologize, but I couldn't process that request.",
          timestamp: new Date(),
          toolInvocations: finalResponse.toolInvocations,
          steps: finalResponse.steps || currentSteps,
          bulkProgress: lastBulkProgress,
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Execute any UI commands from the response
        if (finalResponse.uiCommands && Array.isArray(finalResponse.uiCommands)) {
          executeUICommands(finalResponse.uiCommands)
        }
      } else {
        // No final response received - use accumulated steps
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I completed the task but couldn't generate a summary.",
          timestamp: new Date(),
          steps: currentSteps,
          bulkProgress: lastBulkProgress,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }

    } catch (error) {
      console.error("Assistant streaming error:", error)
      // Remove thinking message
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId))
      
      const errorMessageObj: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: error instanceof Error ? error.message : "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true,
        retryable: true,
      }
      setMessages((prev) => [...prev, errorMessageObj])
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
      setCurrentActivity(null)
      setCurrentAgent(null)
    }
  }, [messages, pageContext, executeUICommands])

  // Listen for AI product creation requests from UI
  useEffect(() => {
    const handleCreateProductsRequest = (event: CustomEvent) => {
      const { imageUrls, autoFill } = event.detail
      
      // Open the assistant panel if not already open
      if (displayMode === "collapsed") {
        setDisplayMode("panel")
      }
      
      // Send a message to the AI to create products
      const message = autoFill
        ? `قم بإنشاء منتجات جديدة من هذه الصور المعالجة وأكمل كل التفاصيل تلقائياً (الاسم، الوصف، السعر المقترح). الصور: ${imageUrls.length} صورة`
        : `ساعدني في إنشاء منتجات من هذه الصور: ${imageUrls.length} صورة`
      
      // Update page context with available images
      setPageContext((prev) => prev ? {
        ...prev,
        availableImages: imageUrls,
        contextData: {
          ...prev.contextData,
          processedImages: imageUrls,
          autoFillRequested: autoFill,
        },
      } : null)
      
      // Trigger the message send
      setTimeout(() => {
        sendMessage(message)
      }, 300)
    }

    window.addEventListener("ai-create-products-request" as any, handleCreateProductsRequest)

    return () => {
      window.removeEventListener("ai-create-products-request" as any, handleCreateProductsRequest)
    }
  }, [displayMode, sendMessage, setPageContext])

  const value: AdminAssistantContextType = {
    displayMode,
    setDisplayMode,
    isOpen,
    open,
    close,
    toggle,
    messages,
    sendMessage,
    isLoading,
    pageContext,
    setPageContext,
    screenshotCount,
    maxScreenshots,
    isGenerating,
    currentActivity,
    currentAgent,
  }

  return (
    <AdminAssistantContext.Provider value={value}>
      {children}
      <AdminAssistantFab />
      {displayMode === "panel" && <AdminAssistantPanel />}
      {/* Side panel is now handled by the layout for better integration */}
    </AdminAssistantContext.Provider>
  )
}
