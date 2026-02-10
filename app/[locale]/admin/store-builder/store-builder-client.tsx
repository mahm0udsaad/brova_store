"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels"
import {
  Send,
  Sparkles,
  Layout,
  Palette,
  Type,
  GripVertical,
  Store,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TemplateOption {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const templates: TemplateOption[] = [
  {
    id: "fashion",
    label: "Fashion Template",
    icon: <Palette className="h-4 w-4" />,
    description: "Image-forward layout with bold collections",
  },
  {
    id: "electronics",
    label: "Electronics Template",
    icon: <Monitor className="h-4 w-4" />,
    description: "Clean grid layout for tech products",
  },
  {
    id: "general",
    label: "General Template",
    icon: <Layout className="h-4 w-4" />,
    description: "Versatile layout for any store type",
  },
]

export function StoreBuilderClient() {
  const [inputValue, setInputValue] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/store-builder",
    }),
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [
          {
            type: "text" as const,
            text: "Welcome to the Store Builder! I can help you design and customize your storefront. Choose a template to get started, or describe what kind of store you want to build.",
          },
        ],
      },
    ],
    onError: (error) => {
      console.error("Store builder chat error:", error)
    },
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template.id)
    sendMessage({
      text: `I want to start with the ${template.label}. ${template.description}.`,
    })
  }

  const lastMessage = messages[messages.length - 1]
  const showCursor =
    isStreaming && lastMessage?.role === "assistant"

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Chat Interface */}
        <Panel defaultSize={45} minSize={30} className="flex flex-col">
          <div className="flex h-full flex-col border-e border-border bg-background">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Store Builder AI</h2>
                  <p className="text-xs text-muted-foreground">
                    Design your store with AI
                  </p>
                </div>
              </div>
            </div>

            {/* Template Quick Start */}
            {!selectedTemplate && messages.length <= 1 && (
              <div className="border-b border-border px-4 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Start Templates
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleTemplateSelect(template)}
                      disabled={isStreaming}
                    >
                      {template.icon}
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {messages.map((message, index) => {
                const isAssistant = message.role === "assistant"
                const isLastAssistant =
                  isAssistant && index === messages.length - 1

                const textContent = message.parts
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text"
                  )
                  .map((p) => p.text)
                  .join("")

                if (!textContent) return null

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isAssistant ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%]",
                        isAssistant ? "space-y-1.5" : ""
                      )}
                    >
                      {isAssistant && (
                        <div className="flex items-center gap-2 px-1">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            AI Builder
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                          isAssistant
                            ? "bg-muted/50 text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {textContent}
                        {isLastAssistant && showCursor && (
                          <span className="ms-0.5 inline-block h-[1.2em] w-[2px] animate-pulse bg-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isStreaming && lastMessage?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all shrink-0",
                    inputValue.trim() && !isStreaming
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                      : "cursor-not-allowed bg-muted/50 text-muted-foreground"
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="group relative flex w-2 items-center justify-center bg-border/50 transition-colors hover:bg-primary/20 active:bg-primary/30">
          <div className="flex h-8 w-full items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </PanelResizeHandle>

        {/* Right Panel: Live Preview */}
        <Panel defaultSize={55} minSize={30} className="flex flex-col">
          <div className="flex h-full flex-col bg-muted/20">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Live Preview</h2>
              </div>
              <Button size="sm" className="gap-1.5">
                <Layout className="h-3.5 w-3.5" />
                Apply to Store
              </Button>
            </div>

            {/* Preview Content */}
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 border border-border">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Live Preview
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Start a conversation with the AI builder to see your store
                    come to life here. Choose a template or describe your ideal
                    store to get started.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    your-store.brova.co
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
