"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ConfirmationCardProps {
  action: string
  description: string
  draftIds: string[]
  totalProducts: number
  locale?: "en" | "ar"
  onConfirm: (draftIds: string[]) => void
  onCancel: () => void
}

export function ConfirmationCard({
  action,
  description,
  draftIds,
  totalProducts,
  locale = "en",
  onConfirm,
  onCancel,
}: ConfirmationCardProps) {
  const [state, setState] = useState<"idle" | "confirming" | "done">("idle")
  const isRtl = locale === "ar"

  const handleConfirm = () => {
    setState("confirming")
    onConfirm(draftIds)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20",
        isRtl && "text-right"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRtl
              ? `سيتم إنشاء ${totalProducts} منتج(ات) في متجرك.`
              : `This will create ${totalProducts} product(s) in your store.`}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={state !== "idle"}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all",
                state === "idle"
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "cursor-not-allowed bg-violet-400"
              )}
            >
              {state === "confirming" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {isRtl ? "تأكيد الإنشاء" : "Confirm & Create"}
            </button>

            <button
              onClick={onCancel}
              disabled={state !== "idle"}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
            >
              <XCircle className="h-3.5 w-3.5" />
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
