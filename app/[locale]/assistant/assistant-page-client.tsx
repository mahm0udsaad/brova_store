"use client"

import { useChat } from "ai/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Header } from "@/components/header"
import { AssistantProductCard } from "@/components/assistant/assistant-product-card"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import { useLocale, useTranslations } from "next-intl"

type ToolInvocation = {
  toolName: string
  state?: "partial-call" | "call" | "result"
  result?: { products?: Product[] }
}

export default function AssistantPageClient() {
  const locale = useLocale()
  const t = useTranslations("assistantPage")
  const isRtl = locale === "ar"
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const initialMessages = useMemo(
    () => [
      {
        id: "assistant-welcome",
        role: "assistant" as const,
        content: t("welcomeMessage"),
      },
    ],
    [t],
  )

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/assistant",
    initialMessages,
    fetch: async (input, init) => {
      const response = await fetch(input, init)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || t("errors.requestFailed"))
      }
      return response
    },
    onResponse: response => {
      if (!response.ok) {
        setErrorMessage(t("errors.unavailable"))
      }
    },
    onError: error => {
      const message = error instanceof Error ? error.message : t("errors.unavailable")
      setErrorMessage(message)
    },
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  const renderToolProducts = (toolInvocations?: ToolInvocation[]) => {
    if (!toolInvocations?.length) return null
    const products = toolInvocations.flatMap(invocation =>
      invocation.toolName === "searchProducts" && invocation.state === "result"
        ? invocation.result?.products ?? []
        : [],
    )

    if (!products.length) return null

    return (
      <div className="mt-4 -mx-4 px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("productCount", { count: products.length })}
          </p>
          <p className="text-xs text-muted-foreground/60">{isRtl ? t("swipeLeft") : t("swipeRight")}</p>
        </div>
        <div 
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory overscroll-x-contain"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollPaddingLeft: '1rem',
            scrollPaddingRight: '1rem'
          }}
        >
          {products.map(product => (
            <AssistantProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    )
  }

  // Get the last message to show cursor on streaming
  const lastMessage = messages[messages.length - 1]
  const isLastMessageFromAssistant = lastMessage?.role === "assistant"
  const showCursor = isLoading && isLastMessageFromAssistant

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground">
      <Header title={t("title")} showThemeToggle />

      <div className="flex h-full flex-col pt-16">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-40 pt-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastAssistantMessage = isAssistant && index === messages.length - 1
              const messageAlign = isAssistant ? (isRtl ? "items-end" : "items-start") : (isRtl ? "items-start" : "items-end")
              
              return (
                <div key={message.id} className={cn("flex flex-col gap-2", messageAlign)}>
                  {isAssistant && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{t("assistantName")}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[90%] text-[15px] leading-relaxed",
                      isAssistant
                        ? "text-foreground"
                        : "rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm",
                    )}
                  >
                    <p className="whitespace-pre-wrap">
                      {message.content}
                      {isLastAssistantMessage && showCursor && (
                        <span className="ml-0.5 inline-block h-[1.2em] w-[2px] animate-pulse bg-foreground" />
                      )}
                    </p>
                    {renderToolProducts((message as { toolInvocations?: ToolInvocation[] }).toolInvocations)}
                  </div>
                </div>
              )
            })}

            {errorMessage && (
              <div className={cn("flex flex-col gap-2", isRtl ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{t("assistantName")}</span>
                </div>
                <div className="text-[15px] text-muted-foreground">
                  {errorMessage}
                </div>
              </div>
            )}

            {isLoading && !showCursor && (
              <div className={cn("flex flex-col gap-2", isRtl ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{t("thinking")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="fixed bottom-20 inset-x-0 z-30 border-t border-border/40 bg-background/95 px-4 py-4 backdrop-blur-xl sm:bottom-24"
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={t("inputPlaceholder")}
              className="flex-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                input.trim() && !isLoading
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                  : "cursor-not-allowed bg-muted/50 text-muted-foreground",
              )}
              aria-label={t("sendMessage")}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>

        <BottomNav />
      </div>
    </div>
  )
}
