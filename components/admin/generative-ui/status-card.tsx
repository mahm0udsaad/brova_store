"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface StatusCardProps {
  success: boolean
  title: string
  message: string
  details?: Record<string, any>
  locale?: "en" | "ar"
}

export function StatusCard({
  success,
  title,
  message,
  details,
  locale = "en",
}: StatusCardProps) {
  const isRtl = locale === "ar"
  const Icon = success ? CheckCircle : XCircle

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-xl border p-4",
        success
          ? "border-green-200 bg-green-50/50 dark:border-green-800/40 dark:bg-green-950/20"
          : "border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20",
        isRtl && "text-right"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            success ? "text-green-500" : "text-red-500"
          )}
        />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>

          {(details?.created_product_ids?.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              {isRtl ? "تم إنشاء" : "Created"}{" "}
              {details!.created_product_ids.length}{" "}
              {isRtl ? "منتج(ات)" : "product(s)"}
            </p>
          )}

          {(details?.failed_draft_ids?.length ?? 0) > 0 && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {isRtl ? "فشل" : "Failed"}: {details!.failed_draft_ids.length}{" "}
              {isRtl ? "مسودة" : "draft(s)"}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
