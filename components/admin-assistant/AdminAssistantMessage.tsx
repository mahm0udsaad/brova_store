"use client"

import { Sparkles, User, Brain, Cog, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message, StepUpdate, BulkProgressData } from "./AdminAssistantProvider"
import { BulkProgressCard } from "./BulkProgressCard"
import { useEffect, useState, useMemo, memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "next-intl"

interface AdminAssistantMessageProps {
  message: Message
  expanded?: boolean
  onRetry?: () => void
}

export const AdminAssistantMessage = memo(function AdminAssistantMessage({ message, expanded = false, onRetry }: AdminAssistantMessageProps) {
  const locale = useLocale()
  const t = useTranslations("assistant")
  const isRtl = locale === "ar"
  const isAssistant = message.role === "assistant"
  const [displayedContent, setDisplayedContent] = useState(isAssistant ? "" : message.content)
  const [showThinking, setShowThinking] = useState(true)
  // Memoize isRecent calculation to avoid recalculating on every render
  const isRecent = useMemo(
    () => new Date().getTime() - new Date(message.timestamp).getTime() < 5000,
    [message.timestamp]
  )
  const isError = message.isError || message.content.toLowerCase().includes("error") || message.content.toLowerCase().includes("encountered an error")
  const rowDirection = isAssistant ? (isRtl ? "flex-row-reverse" : "") : (isRtl ? "" : "flex-row-reverse")
  const bubbleAlign = isAssistant ? (isRtl ? "items-end" : "items-start") : (isRtl ? "items-start" : "items-end")

  useEffect(() => {
    if (!isAssistant || !isRecent) {
      setDisplayedContent(message.content)
      return
    }

    // Typewriter effect
    let currentIndex = 0
    const text = message.content
    // Adjust speed based on length
    const step = text.length > 500 ? 5 : text.length > 200 ? 3 : 2
    
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedContent(text.slice(0, currentIndex))
        currentIndex += step 
      } else {
        setDisplayedContent(text) // Ensure full text is shown at end
        clearInterval(intervalId)
      }
    }, 10) // Faster interval

    return () => clearInterval(intervalId)
  }, [message.content, isAssistant, isRecent])

  return (
    <div className={cn("flex items-start gap-3", rowDirection)}>
      {/* Avatar */}
      <div
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-full shadow-sm",
          expanded ? "h-8 w-8" : "h-7 w-7",
          isAssistant
            ? "bg-gradient-to-br from-violet-500 to-purple-600"
            : "bg-primary"
        )}
      >
        {isAssistant ? (
          <Sparkles className={cn("text-white", expanded ? "h-4 w-4" : "h-3.5 w-3.5")} />
        ) : (
          <User className={cn("text-primary-foreground", expanded ? "h-4 w-4" : "h-3.5 w-3.5")} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1 min-w-0 max-w-[85%]", bubbleAlign)}>
        {expanded && (
          <p className="text-xs font-medium text-muted-foreground px-1">
            {isAssistant ? t("assistantName") : t("you")}
          </p>
        )}
        
        {/* User Images */}
        {!isAssistant && message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1 max-w-full">
            {message.images.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`Attachment ${idx + 1}`}
                className="h-16 w-16 rounded-lg object-cover border border-primary/20"
              />
            ))}
          </div>
        )}

        {/* Bulk Progress Card (live) */}
        {message.isThinking && message.bulkProgress && (
          <div className="w-full mb-2">
            <BulkProgressCard progress={message.bulkProgress} isLive />
          </div>
        )}

        {/* Bulk Progress Card (completed) */}
        {!message.isThinking && message.bulkProgress && (
          <div className="w-full mb-2">
            <BulkProgressCard progress={message.bulkProgress} isLive={false} />
          </div>
        )}

        {/* Real-time execution timeline */}
        {message.isThinking && message.steps && message.steps.length > 0 && (
          <div className="w-full max-w-md">
            <div className="space-y-0 rounded-xl border bg-card/50 p-4 shadow-lg">
              {/* Header with pulsing indicator */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500 relative z-10" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {getCurrentActionLabel(message.steps[message.steps.length - 1], t)}
                </span>
              </div>
              
              {/* Current action detail */}
              {message.steps.length > 0 && (
                <div className="mb-3 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <CurrentActionDisplay step={message.steps[message.steps.length - 1]} t={t} />
                </div>
              )}

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-violet-500 via-purple-500 to-muted-foreground/20" />
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {message.steps.map((step, idx) => (
                    <TimelineStep key={idx} step={step} isLast={idx === message.steps!.length - 1} t={t} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple thinking indicator (fallback) */}
        {message.isThinking && (!message.steps || message.steps.length === 0) && (
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-3 shadow-lg">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                <Brain className="h-4 w-4 text-violet-500 animate-pulse relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{t("thinkingTitle")}</span>
                <span className="text-xs text-muted-foreground">{t("thinkingSubtitle")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error indicator */}
        {isError && isAssistant && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive font-medium">{t("errorTitle")}</span>
            {onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRetry}
                className="ml-auto h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t("retry")}
              </Button>
            )}
          </div>
        )}

        {/* Completed execution timeline (collapsible) */}
        {!message.isThinking && message.steps && message.steps.length > 0 && (
          <div className="w-full max-w-md mb-3">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <Brain className="h-3 w-3" />
              <span>{showThinking ? t("hideTimeline") : t("showTimeline")} {t("timelineCount", { count: message.steps.length })}</span>
            </button>
            
            {showThinking && (
              <div className="rounded-xl border bg-card/50 p-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-green-500 to-muted-foreground/20" />
                  
                  <div className="space-y-3">
                    {message.steps.map((step, idx) => (
                      <TimelineStep key={idx} step={step} isLast={idx === message.steps!.length - 1} isCompleted t={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "text-sm leading-relaxed rounded-2xl",
            isAssistant
              ? isError
                ? "text-foreground border border-destructive/20 bg-destructive/5 px-4 py-3"
                : "text-foreground"
              : "px-4 py-2.5 bg-primary text-primary-foreground shadow-sm"
          )}
        >
          {isAssistant ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-2 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-2 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-3 mt-4 first:mt-0 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-medium mb-2 mt-2 first:mt-0 text-muted-foreground">{children}</h3>,
                code: ({ children, ...props }: any) => {
                  const inline = !(props.className?.includes("language-"))
                  if (inline) {
                    return <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props}>{children}</code>
                  }
                  return (
                    <code className="block bg-muted border border-border p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3" {...props}>
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <pre className="bg-muted border border-border p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3">{children}</pre>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-primary/40 bg-muted/30 pl-4 py-2 italic my-3 rounded-r">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-4 border-border" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-2 py-1">
                    {children}
                  </td>
                ),
              }}
            >
              {displayedContent}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{displayedContent}</p>
          )}
        </div>

        {/* Tool Results */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {message.toolInvocations.map((invocation: any, idx: number) => (
              <ToolResultCard key={idx} invocation={invocation} t={t} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        {expanded && (
          <p className="text-[10px] text-muted-foreground/60 px-1">
            {formatTime(message.timestamp, locale)}
          </p>
        )}
      </div>
    </div>
  )
})

function ToolResultCard({ invocation, t }: { invocation: any; t: ReturnType<typeof useTranslations> }) {
  if (invocation.state !== "result") return null

  const { toolName, result } = invocation

  // Handle different tool results
  switch (toolName) {
    case "searchProducts":
      if (!result?.products?.length) return null
      return (
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("foundProducts", { count: result.products.length })}
          </p>
          <div className="space-y-2">
            {result.products.slice(0, 3).map((product: any) => (
              <div key={product.id} className="flex items-center gap-2">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.price ? t("priceValue", { value: product.price }) : t("noPrice")}
                  </p>
                </div>
              </div>
            ))}
            {result.products.length > 3 && (
              <p className="text-xs text-muted-foreground">
                {t("moreProducts", { count: result.products.length - 3 })}
              </p>
            )}
          </div>
        </div>
      )

    case "generateImage":
      if (!result?.imageUrl) return null
      return (
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("generatedImage")}
          </p>
          <img
            src={result.imageUrl}
            alt="Generated"
            className="w-full rounded-lg object-cover"
          />
        </div>
      )

    case "analyzeImage":
      return (
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t("imageAnalysis")}
          </p>
          <p className="text-sm">{result?.analysis || t("analysisComplete")}</p>
        </div>
      )

    default:
      return (
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {toolName}
          </p>
          <p className="text-xs text-muted-foreground">
            {result?.success ? t("actionSuccess") : t("actionCompleted")}
          </p>
        </div>
      )
  }
}

function TimelineStep({ step, isLast, isCompleted, t }: { step: StepUpdate; isLast: boolean; isCompleted?: boolean; t: ReturnType<typeof useTranslations> }) {
  const getIcon = () => {
    if (isCompleted || step.type === "complete") {
      return (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-green-500/20">
          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
        </div>
      )
    }
    
    switch (step.type) {
      case "planning":
        return (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-2 ring-blue-500/20 animate-pulse">
            <Brain className="h-2.5 w-2.5 text-white" />
          </div>
        )
      case "executing":
        return (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 ring-2 ring-violet-500/20">
            <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
          </div>
        )
      case "synthesizing":
        return (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 ring-2 ring-purple-500/20 animate-pulse">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
        )
      default:
        return (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/50 ring-2 ring-muted-foreground/10">
            <Cog className="h-2.5 w-2.5 text-white" />
          </div>
        )
    }
  }

  const getTypeColor = () => {
    if (isCompleted || step.type === "complete") return "text-green-600 dark:text-green-400"
    switch (step.type) {
      case "planning": return "text-blue-600 dark:text-blue-400"
      case "executing": return "text-violet-600 dark:text-violet-400"
      case "synthesizing": return "text-purple-600 dark:text-purple-400"
      default: return "text-muted-foreground"
    }
  }

  const getTypeLabel = () => {
    switch (step.type) {
      case "planning": return t("timeline.planning")
      case "executing": return t("timeline.executing")
      case "synthesizing": return t("timeline.synthesizing")
      case "complete": return t("timeline.complete")
      default: return ""
    }
  }

  return (
    <div className="flex items-start gap-3 relative">
      <div className="relative z-10 mt-0.5 flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2 mb-0.5">
          {step.step && step.totalSteps && (
            <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
              {step.step}/{step.totalSteps}
            </span>
          )}
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", getTypeColor())}>
            {getTypeLabel()}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-foreground">
          {step.message}
        </p>
        {step.agentName && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
            {step.agentName}
          </p>
        )}
      </div>
    </div>
  )
}

function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function getCurrentActionLabel(step: StepUpdate, t: ReturnType<typeof useTranslations>): string {
  if (step.type === "planning") {
    if (step.message.includes("Upload")) return t("status.uploadingImages")
    if (step.message.includes("Analyz")) return t("status.analyzingRequest")
    if (step.message.includes("Plan")) return t("status.creatingPlan")
    return t("status.planning")
  }
  if (step.type === "executing") {
    if (step.agentName) {
      const agentNames: Record<string, string> = {
        photographer: t("agents.photographer"),
        product: t("agents.product"),
        marketer: t("agents.marketer"),
        analyst: t("agents.analyst"),
        video: t("agents.video"),
        ui_controller: t("agents.uiController"),
        manager: t("agents.manager"),
      }
      return agentNames[step.agentName] || t("status.runningAgent", { agent: step.agentName })
    }
    return t("status.executingTasks")
  }
  if (step.type === "synthesizing") return t("status.preparingResponse")
  if (step.type === "complete") return t("status.complete")
  return t("status.processing")
}

function CurrentActionDisplay({ step, t }: { step: StepUpdate; t: ReturnType<typeof useTranslations> }) {
  const getAgentIcon = () => {
    switch (step.agentName) {
      case "photographer":
        return "📷"
      case "product":
        return "📦"
      case "marketer":
        return "📣"
      case "analyst":
        return "📊"
      case "video":
        return "🎬"
      case "ui_controller":
        return "🖥️"
      case "manager":
        return "🤖"
      default:
        return "⚡"
    }
  }

  const getActionDetails = () => {
    if (step.action) {
      const actionLabels: Record<string, string> = {
        batch_process: t("actions.batchProcess"),
        remove_background: t("actions.removeBackground"),
        generate_image: t("actions.generateImage"),
        generate_lifestyle: t("actions.generateLifestyle"),
        generate_model_shot: t("actions.generateModelShot"),
        generate_showcase: t("actions.generateShowcase"),
        show_notification: t("actions.showNotification"),
        navigate_to: t("actions.navigateTo"),
        upload_images: t("actions.uploadImages"),
        update_product_details: t("actions.updateProductDetails"),
        create_product: t("actions.createProduct"),
        search_products: t("actions.searchProducts"),
        start_bulk_processing: t("actions.startBulkProcessing"),
      }
      return actionLabels[step.action] || step.action.replace(/_/g, " ")
    }
    return step.message
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{getAgentIcon()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {getActionDetails()}
        </p>
        {step.step && step.totalSteps && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 transition-all duration-300 ease-out"
                style={{ width: `${(step.step / step.totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {step.step}/{step.totalSteps}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
