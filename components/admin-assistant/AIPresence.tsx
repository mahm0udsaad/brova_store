"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { useAdminAssistant, useAdminAssistantActivity } from "./AdminAssistantProvider"
import { 
  Sparkles, 
  MessageSquare, 
  Loader2,
  ChevronRight,
} from "lucide-react"
import { useLocale } from "next-intl"

// =============================================================================
// AI STATUS INDICATOR
// =============================================================================

interface AIStatusIndicatorProps {
  className?: string
  showLabel?: boolean
}

export function AIStatusIndicator({ 
  className, 
  showLabel = true 
}: AIStatusIndicatorProps) {
  const { isLoading, isGenerating, currentActivity, currentAgent } = useAdminAssistantActivity()
  const locale = useLocale()
  const isRtl = locale === "ar"
  
  const isActive = isLoading || isGenerating

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "bg-muted text-muted-foreground",
        className
      )}
      animate={isActive ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {isActive ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          {showLabel && (
            <span className="truncate max-w-[150px]">
              {currentActivity || (currentAgent ? `${currentAgent} working...` : "Thinking...")}
            </span>
          )}
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3" />
          {showLabel && (
            <span>{isRtl ? "AI جاهز" : "AI Ready"}</span>
          )}
        </>
      )}
    </motion.div>
  )
}

// =============================================================================
// AI SUGGESTION CHIPS
// =============================================================================

interface AISuggestion {
  id: string
  label: string
  prompt: string
  icon?: React.ComponentType<{ className?: string }>
}

interface AISuggestionChipsProps {
  suggestions?: AISuggestion[]
  onSelect?: (suggestion: AISuggestion) => void
  className?: string
}

export function AISuggestionChips({
  suggestions = [],
  onSelect,
  className,
}: AISuggestionChipsProps) {
  const { sendMessage, isLoading } = useAdminAssistant()
  const locale = useLocale()
  const isRtl = locale === "ar"

  const handleSelect = (suggestion: AISuggestion) => {
    if (isLoading) return
    onSelect?.(suggestion)
    sendMessage(suggestion.prompt)
  }

  if (suggestions.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon || Sparkles
        
        return (
          <motion.button
            key={suggestion.id}
            onClick={() => handleSelect(suggestion)}
            disabled={isLoading}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
              "bg-muted hover:bg-accent hover:text-accent-foreground",
              "border border-transparent hover:border-primary/20",
              "transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ...springConfigs.gentle }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>{suggestion.label}</span>
            <ChevronRight className={cn(
              "w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-1",
              "group-hover:opacity-100 group-hover:translate-x-0",
              "transition-all duration-150",
              isRtl && "rotate-180"
            )} />
          </motion.button>
        )
      })}
    </div>
  )
}

// =============================================================================
// AI QUICK ACTIONS BAR
// =============================================================================

interface AIQuickActionsBarProps {
  title?: string
  suggestions: AISuggestion[]
  className?: string
}

export function AIQuickActionsBar({
  title,
  suggestions,
  className,
}: AIQuickActionsBarProps) {
  const locale = useLocale()
  const isRtl = locale === "ar"

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-medium">
          {title || (isRtl ? "اقتراحات AI" : "AI Suggestions")}
        </h3>
        <AIStatusIndicator showLabel={false} className="ms-auto" />
      </div>

      {/* Suggestions */}
      <AISuggestionChips suggestions={suggestions} />
    </motion.div>
  )
}

// =============================================================================
// AI INLINE INPUT
// =============================================================================

interface AIInlineInputProps {
  placeholder?: string
  onSubmit?: (message: string) => void
  className?: string
  compact?: boolean
}

export function AIInlineInput({
  placeholder,
  onSubmit,
  className,
  compact = false,
}: AIInlineInputProps) {
  const { sendMessage, isLoading, open } = useAdminAssistant()
  const [input, setInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const locale = useLocale()
  const isRtl = locale === "ar"

  const defaultPlaceholder = isRtl 
    ? "اسأل AI أي شيء..."
    : "Ask AI anything..."

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const message = input.trim()
    setInput("")
    
    if (onSubmit) {
      onSubmit(message)
    } else {
      open() // Open the panel
      sendMessage(message)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center gap-2",
        className
      )}
    >
      <div className="relative flex-1">
        <div className="absolute inset-y-0 ltr:left-3 rtl:right-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          disabled={isLoading}
          className={cn(
            "w-full bg-muted border border-transparent rounded-xl",
            "ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:border-primary/50 focus:bg-background",
            "transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            compact ? "py-2 text-sm" : "py-3"
          )}
        />
      </div>
      
      <motion.button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={cn(
          "flex items-center justify-center rounded-xl",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          compact ? "p-2" : "px-4 py-3"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MessageSquare className={cn("w-4 h-4", !compact && "me-2")} />
        {!compact && (
          <span className="text-sm font-medium">
            {isRtl ? "إرسال" : "Send"}
          </span>
        )}
      </motion.button>
    </form>
  )
}

// =============================================================================
// AI CONTEXT AWARE HELPER
// =============================================================================

interface AIContextHelperProps {
  context: string
  suggestions: AISuggestion[]
  className?: string
}

export function AIContextHelper({
  context,
  suggestions,
  className,
}: AIContextHelperProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const locale = useLocale()
  const isRtl = locale === "ar"

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
    >
      {/* Collapsed State */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isRtl ? "مساعد AI" : "AI Assistant"}
            </p>
            <p className="text-xs text-muted-foreground">
              {context}
            </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          isExpanded && "rotate-90",
          isRtl && "rotate-180",
          isRtl && isExpanded && "rotate-90"
        )} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springConfigs.smooth}
            className="border-t border-primary/10"
          >
            <div className="p-4 space-y-4">
              <AISuggestionChips suggestions={suggestions} />
              <AIInlineInput compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
