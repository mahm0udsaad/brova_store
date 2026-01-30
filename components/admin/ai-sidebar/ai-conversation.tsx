"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Trash2, Sparkles, User } from "lucide-react"
import { AIThinkingIndicator } from "./ai-thinking"
import { cn } from "@/lib/utils"
import type { Message } from "./ai-sidebar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AIConversationProps {
  messages: Message[]
  isStreaming: boolean
  onClear: () => void
}

export function AIConversation({ messages, isStreaming, onClear }: AIConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Clear button */}
      {messages.length > 0 && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear conversation
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">How can I help you today?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              I can help you with products, marketing, analytics, and more.
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>Try asking me to:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-xs">
                <li>Create a new product</li>
                <li>Generate product images</li>
                <li>Write social media captions</li>
                <li>Analyze sales trends</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[80%]",
                message.role === "user"
                  ? "bg-violet-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              )}
            >
              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {message.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Attachment ${idx + 1}`}
                      className="rounded-lg w-full h-24 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Thinking steps */}
              {message.steps && message.steps.length > 0 && (
                <div className="mt-3">
                  <AIThinkingIndicator steps={message.steps} />
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
