"use client"

import { CheckCircle2, Loader2, XCircle, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface BulkProgressItem {
  id: string
  name: string
  status: "pending" | "updating" | "done" | "failed"
  error?: string
}

interface BulkProgressData {
  operationId: string
  operationLabel: string
  current: number
  total: number
  item: BulkProgressItem
  completedItems: Array<{ id: string; name: string; status: "done" | "failed"; error?: string }>
}

interface BulkProgressCardProps {
  progress: BulkProgressData
  isLive?: boolean
}

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    if (start === end) return

    const duration = 300
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplayed(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{displayed}</span>
}

export function BulkProgressCard({ progress, isLive = true }: BulkProgressCardProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const percentage = Math.round((progress.current / progress.total) * 100)
  const isDone = progress.current === progress.total && !isLive
  const failedCount = progress.completedItems.filter((i) => i.status === "failed").length
  const successCount = progress.completedItems.filter((i) => i.status === "done").length

  // Auto-scroll to bottom of list
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [progress.completedItems.length])

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full",
              isDone ? "bg-green-500/20" : "bg-violet-500/20"
            )}>
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
              )}
            </div>
            <span className="text-xs font-semibold text-foreground">
              {progress.operationLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AnimatedCounter value={progress.current} className="text-sm font-bold text-foreground tabular-nums" />
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">{progress.total}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isDone
                ? failedCount > 0 ? "bg-amber-500" : "bg-green-500"
                : "bg-gradient-to-r from-violet-500 to-purple-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Product list */}
      <div ref={listRef} className="max-h-[200px] overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-border/30">
          {progress.completedItems.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2 transition-all duration-300",
                idx === progress.completedItems.length - 1 && isLive && "animate-in fade-in slide-in-from-bottom-2 duration-300"
              )}
            >
              {item.status === "done" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              )}
              <span className={cn(
                "text-xs flex-1 truncate",
                item.status === "done" ? "text-muted-foreground" : "text-red-500"
              )}>
                {item.name}
              </span>
              {item.status === "done" && (
                <span className="text-[10px] text-green-500/70 font-medium">Done</span>
              )}
              {item.status === "failed" && (
                <span className="text-[10px] text-red-500/70 font-medium">Failed</span>
              )}
            </div>
          ))}

          {/* Currently updating item */}
          {isLive && progress.item.status === "updating" && (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-violet-500/5 animate-in fade-in duration-200">
              <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin flex-shrink-0" />
              <span className="text-xs flex-1 truncate text-foreground font-medium">
                {progress.item.name}
              </span>
              <span className="text-[10px] text-violet-500 font-medium">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer summary */}
      {isDone && (
        <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {successCount} updated{failedCount > 0 ? `, ${failedCount} failed` : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
