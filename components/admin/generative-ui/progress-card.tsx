"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2, Sparkles, CheckCircle, Image as ImageIcon } from "lucide-react"

interface ProgressCardProps {
  status: "processing" | "analyzing" | "generating" | "uploading" | "complete"
  message: string

  // For batch operations
  current?: number
  total?: number

  // Optional details
  details?: string

  locale?: "en" | "ar"
  variant?: "default" | "compact"
}

export function ProgressCard({
  status,
  message,
  current,
  total,
  details,
  locale = "en",
  variant = "default",
}: ProgressCardProps) {
  const isRtl = locale === "ar"
  const isComplete = status === "complete"

  // Calculate progress percentage
  const progress =
    current != null && total != null && total > 0
      ? Math.round((current / total) * 100)
      : undefined

  // Status-specific configuration
  const statusConfig = {
    processing: {
      icon: Loader2,
      color: "text-blue-500",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800/40",
      animate: true,
    },
    analyzing: {
      icon: Sparkles,
      color: "text-violet-500",
      bgColor: "bg-violet-50/50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-800/40",
      animate: true,
    },
    generating: {
      icon: Sparkles,
      color: "text-amber-500",
      bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800/40",
      animate: true,
    },
    uploading: {
      icon: ImageIcon,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50/50 dark:bg-cyan-950/20",
      borderColor: "border-cyan-200 dark:border-cyan-800/40",
      animate: true,
    },
    complete: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50/50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800/40",
      animate: false,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  // Compact variant (for inline use)
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5",
          config.bgColor,
          config.borderColor,
          isRtl && "flex-row-reverse"
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Icon
          className={cn("h-3.5 w-3.5", config.color, config.animate && "animate-spin")}
        />
        <span className="text-xs font-medium text-foreground">{message}</span>
        {progress != null && (
          <span className="text-xs text-muted-foreground">({progress}%)</span>
        )}
      </motion.div>
    )
  }

  // Default variant (card)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        config.bgColor,
        config.borderColor,
        isRtl && "text-right"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            config.color,
            config.animate && "animate-spin"
          )}
        />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">{message}</p>

          {details && (
            <p className="text-xs text-muted-foreground">{details}</p>
          )}

          {/* Progress indicator */}
          {current != null && total != null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {isRtl
                    ? `${current} من ${total}`
                    : `${current} of ${total}`}
                </span>
                {progress != null && (
                  <span className="font-medium text-foreground">{progress}%</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full", config.color.replace("text-", "bg-"))}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Pulsing dots animation for indeterminate progress */}
          {!isComplete && current == null && (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={cn("h-1 w-1 rounded-full", config.color.replace("text-", "bg-"))}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
