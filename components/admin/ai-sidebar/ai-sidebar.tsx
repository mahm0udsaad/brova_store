"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Maximize2, Minimize2 } from "lucide-react"
import { AIConversation } from "./ai-conversation"
import { AIInputArea } from "./ai-input-area"
import { motionPresets } from "@/lib/ui/motion-presets"
import { useAIStream } from "@/hooks/use-ai-stream"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  images?: string[]
  steps?: StepUpdate[]
  thinking?: boolean
}

export interface StepUpdate {
  type: "planning" | "executing" | "synthesizing" | "complete"
  step?: number
  totalSteps?: number
  agentName?: string
  action?: string
  message: string
  data?: any
}

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function AISidebar({ isOpen, onClose, className }: AISidebarProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const isRtl = locale === "ar"
  const [messages, setMessages] = useState<Message[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { streamMessage, isStreaming, cancelStream } = useAIStream()

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai-sidebar-messages")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })))
      } catch (e) {
        console.error("Failed to load messages:", e)
      }
    }

    // Load expanded state
    const savedExpanded = localStorage.getItem("ai-sidebar-expanded")
    if (savedExpanded) {
      setIsExpanded(savedExpanded === "true")
    }
  }, [])

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai-sidebar-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Save expanded state
  useEffect(() => {
    localStorage.setItem("ai-sidebar-expanded", String(isExpanded))
  }, [isExpanded])

  // Keyboard shortcut: Cmd/Ctrl + Shift + A
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeydown)
      return () => document.removeEventListener("keydown", handleKeydown)
    }
  }, [isOpen, onClose])

  const handleSendMessage = useCallback(async (content: string, images?: string[]) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      images,
    }

    setMessages((prev) => [...prev, userMessage])

    // Stream the AI response
    await streamMessage(
      content,
      images,
      (message) => {
        // Update the current assistant message
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage?.role === "assistant" && lastMessage.id === message.id) {
            // Update existing message
            return [...prev.slice(0, -1), message]
          } else {
            // Add new message
            return [...prev, message]
          }
        })
      },
      () => {
        // Stream complete
        console.log("Stream complete")
      }
    )
  }, [streamMessage])

  const handleClearConversation = useCallback(() => {
    setMessages([])
    localStorage.removeItem("ai-sidebar-messages")
  }, [])

  const width = isExpanded ? 600 : 480
  const slideX = isRtl ? -width : width

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: slideX }}
            animate={{ x: 0 }}
            exit={{ x: slideX }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width }}
            className={cn(
              "fixed top-0 ltr:right-0 rtl:left-0 h-full bg-white dark:bg-gray-950 ltr:border-l rtl:border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{t("aiSidebar.title")}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isStreaming ? t("aiSidebar.thinking") : t("aiSidebar.ready")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={isExpanded ? t("aiSidebar.minimize") : t("aiSidebar.expand")}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={t("aiSidebar.closeWithShortcut", { shortcut: "Cmd+Shift+A" })}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-hidden">
              <AIConversation
                messages={messages}
                isStreaming={isStreaming}
                onClear={handleClearConversation}
              />
            </div>

            {/* Input Area */}
            <AIInputArea
              onSend={handleSendMessage}
              disabled={isStreaming}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
