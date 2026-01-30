"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, Check, X } from "lucide-react"
import Image from "next/image"

interface BeforeAfterPreviewProps {
  type: "text" | "image"
  locale?: "en" | "ar"

  // For text comparison
  before?: {
    title?: string
    content: string
  }
  after?: {
    title?: string
    content: string
  }

  // For image comparison
  beforeImageUrl?: string
  afterImageUrl?: string

  fieldLabel?: string
  onApprove?: () => void
  onReject?: () => void
  showActions?: boolean
  disabled?: boolean
}

export function BeforeAfterPreview({
  type,
  locale = "en",
  before,
  after,
  beforeImageUrl,
  afterImageUrl,
  fieldLabel,
  onApprove,
  onReject,
  showActions = true,
  disabled = false,
}: BeforeAfterPreviewProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const isRtl = locale === "ar"

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || type !== "image") return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percent)))
  }

  // Text comparison view
  if (type === "text") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm",
          isRtl && "text-right"
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {fieldLabel && (
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {fieldLabel}
            </p>
          </div>
        )}

        <div className="grid gap-3 p-4 md:grid-cols-2">
          {/* Before */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-red-200 dark:bg-red-900/30" />
              <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
                {isRtl ? "قبل" : "Before"}
              </span>
              <div className="h-px flex-1 bg-red-200 dark:bg-red-900/30" />
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              {before?.title && (
                <p className="mb-1 text-sm font-semibold text-foreground">
                  {before.title}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-through decoration-red-500">
                {before?.content || "—"}
              </p>
            </div>
          </div>

          {/* After */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-green-200 dark:bg-green-900/30" />
              <span className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">
                {isRtl ? "بعد" : "After"}
              </span>
              <div className="h-px flex-1 bg-green-200 dark:bg-green-900/30" />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900/40 dark:bg-green-950/20">
              {after?.title && (
                <p className="mb-1 text-sm font-semibold text-foreground">
                  {after.title}
                </p>
              )}
              <p className="text-sm font-medium text-foreground">
                {after?.content || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (onApprove || onReject) && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            {onReject && (
              <button
                onClick={onReject}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <X className="h-3.5 w-3.5" />
                {isRtl ? "رفض" : "Reject"}
              </button>
            )}
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Check className="h-3.5 w-3.5" />
                {isRtl ? "قبول التغييرات" : "Accept Changes"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  // Image comparison view (with slider)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        isRtl && "text-right"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {fieldLabel && (
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {fieldLabel}
          </p>
        </div>
      )}

      {/* Interactive slider comparison */}
      <div
        className="relative aspect-square cursor-col-resize select-none overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Before image (full) */}
        {beforeImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={beforeImageUrl}
              alt={isRtl ? "قبل" : "Before"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute left-2 top-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {isRtl ? "قبل" : "Before"}
            </div>
          </div>
        )}

        {/* After image (clipped) */}
        {afterImageUrl && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <Image
              src={afterImageUrl}
              alt={isRtl ? "بعد" : "After"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute right-2 top-2 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {isRtl ? "بعد" : "After"}
            </div>
          </div>
        )}

        {/* Slider handle */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="relative">
            <div className="absolute -left-px h-full w-0.5 bg-white shadow-lg" />
            <div className="-ml-5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-violet-500">
              <ArrowLeftRight className="h-4 w-4 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onApprove || onReject) && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {onReject && (
            <button
              onClick={onReject}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <X className="h-3.5 w-3.5" />
              {isRtl ? "رفض" : "Reject"}
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {isRtl ? "قبول التغييرات" : "Accept Changes"}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
