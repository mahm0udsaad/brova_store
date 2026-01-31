"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Header } from "@/components/header"
import { AssistantProductCard } from "@/components/assistant/assistant-product-card"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import { useLocale, useTranslations } from "next-intl"

export default function AssistantPageClient() {
  const locale = useLocale()
  const t = useTranslations("assistantPage")
  const isRtl = locale === "ar"
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
    messages: [
      {
        id: "assistant-welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: t("welcomeMessage") }],
      },
    ],
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("errors.unavailable")
      setErrorMessage(message)
    },
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return
    setErrorMessage(null)
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  // Extract products from tool-searchProducts parts
  const getToolProducts = (message: (typeof messages)[number]): Product[] => {
    const products: Product[] = []
    for (const part of message.parts) {
      const p = part as any
      if (
        p.type === "tool-searchProducts" &&
        p.state === "output-available" &&
        p.output?.products
      ) {
        products.push(...p.output.products)
      }
    }
    return products
  }

  // Get the last message to show cursor on streaming
  const lastMessage = messages[messages.length - 1]
  const isLastMessageFromAssistant = lastMessage?.role === "assistant"
  const showCursor = isStreaming && isLastMessageFromAssistant

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground">
      <Header title={t("title")} showThemeToggle />

      <div className="flex h-full flex-col pt-16">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-40 pt-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastAssistantMessage =
                isAssistant && index === messages.length - 1
              const messageAlign = isAssistant
                ? isRtl
                  ? "items-end"
                  : "items-start"
                : isRtl
                  ? "items-start"
                  : "items-end"

              // Get text from parts
              const textContent = message.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("")

              const toolProducts = getToolProducts(message)

              return (
                <div
                  key={message.id}
                  className={cn("flex flex-col gap-2", messageAlign)}
                >
                  {isAssistant && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("assistantName")}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[90%] text-[15px] leading-relaxed",
                      isAssistant
                        ? "text-foreground"
                        : "rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
                    )}
                  >
                    {textContent && (
                      <p className="whitespace-pre-wrap">
                        {textContent}
                        {isLastAssistantMessage && showCursor && (
                          <span className="ms-0.5 inline-block h-[1.2em] w-[2px] animate-pulse bg-foreground" />
                        )}
                      </p>
                    )}
                    {toolProducts.length > 0 && (
                      <div className="mt-4 -mx-4 px-4">
                        <div className="mb-3 flex items-center justify-between px-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("productCount", { count: toolProducts.length })}
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            {isRtl ? t("swipeLeft") : t("swipeRight")}
                          </p>
                        </div>
                        <div
                          className="scrollbar-hide flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory overscroll-x-contain"
                          style={{
                            WebkitOverflowScrolling: "touch",
                            scrollPaddingInlineStart: "1rem",
                            scrollPaddingInlineEnd: "1rem",
                          }}
                        >
                          {toolProducts.map((product) => (
                            <AssistantProductCard
                              key={product.id}
                              product={product}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {errorMessage && (
              <div
                className={cn(
                  "flex flex-col gap-2",
                  isRtl ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("assistantName")}
                  </span>
                </div>
                <div className="text-[15px] text-muted-foreground">
                  {errorMessage}
                </div>
              </div>
            )}

            {isStreaming && !showCursor && (
              <div
                className={cn(
                  "flex flex-col gap-2",
                  isRtl ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("thinking")}
                  </span>
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("inputPlaceholder")}
              className="flex-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                inputValue.trim() && !isStreaming
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                  : "cursor-not-allowed bg-muted/50 text-muted-foreground"
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
