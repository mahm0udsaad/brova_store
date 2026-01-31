"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { StoreBuilderUIMessage } from "@/lib/agents/store-builder-agent"
import { useEffect, useRef, useState } from "react"
import { Send, Square, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddComponentView } from "./tool-views/add-component-view"
import { EditComponentView } from "./tool-views/edit-component-view"
import { RemoveComponentView } from "./tool-views/remove-component-view"
import { BulkProductsView } from "./tool-views/bulk-products-view"
import { BulkImagesView } from "./tool-views/bulk-images-view"
import { GenerateImageView } from "./tool-views/generate-image-view"
import { AddProductView } from "./tool-views/add-product-view"
import { ConfigurePaymentsView } from "./tool-views/configure-payments-view"
import { ChangeThemeView } from "./tool-views/change-theme-view"
import { PreviewStoreView } from "./tool-views/preview-store-view"

export function ChatPanel({
  storeId,
  sessionId,
}: {
  storeId: string
  sessionId: string
}) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop } =
    useChat<StoreBuilderUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/onboarding/chat",
        body: { storeId, sessionId },
      }),
    })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, status])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  return (
    <div
      dir="rtl"
      className="flex h-full flex-col bg-[#1a1a2e] text-white font-[IBM_Plex_Sans_Arabic]"
    >
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-start" : "justify-end"
            )}
          >
            <div className="max-w-[85%] space-y-2">
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 justify-end pe-1">
                  <span className="text-xs font-medium text-gray-400">
                    برُوفا
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              )}

              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                          message.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-[#16213e] text-gray-200 border border-indigo-500/10"
                        )}
                      >
                        {part.text}
                      </div>
                    )

                  case "tool-addComponent":
                    return <AddComponentView key={i} invocation={part} />
                  case "tool-editComponent":
                    return <EditComponentView key={i} invocation={part} />
                  case "tool-removeComponent":
                    return <RemoveComponentView key={i} invocation={part} />
                  case "tool-bulkAddProducts":
                    return <BulkProductsView key={i} invocation={part} />
                  case "tool-bulkGenerateImages":
                    return <BulkImagesView key={i} invocation={part} />
                  case "tool-generateImage":
                    return <GenerateImageView key={i} invocation={part} />
                  case "tool-addProduct":
                    return <AddProductView key={i} invocation={part} />
                  case "tool-configurePayments":
                    return <ConfigurePaymentsView key={i} invocation={part} />
                  case "tool-changeTheme":
                    return <ChangeThemeView key={i} invocation={part} />
                  case "tool-previewStore":
                    return <PreviewStoreView key={i} invocation={part} />

                  default:
                    return null
                }
              })}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 pe-1">
              <span className="text-xs text-gray-400">جارِ التفكير...</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-indigo-500/10 bg-[#16213e] p-4"
      >
        <div className="flex items-center gap-3">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 rounded-xl border border-indigo-500/20 bg-[#1a1a2e] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500/50 focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              aria-label="إيقاف"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                inputValue.trim()
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              )}
              aria-label="إرسال"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
