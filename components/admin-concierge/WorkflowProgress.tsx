"use client"

import { motion } from "framer-motion"
import { Check, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ONBOARDING_WORKFLOW_STAGES } from "@/lib/agents/v2/workflow-stages"

interface WorkflowProgressProps {
  currentStage: number
  totalStages: number
  locale?: "en" | "ar"
}

/**
 * Visual progress indicator for workflow stages
 * Shows current stage, completed stages, and upcoming stages
 */
export function WorkflowProgress({ currentStage, totalStages, locale = "en" }: WorkflowProgressProps) {
  const t = useTranslations("onboarding")
  const isRtl = locale === "ar"

  const progress = Math.round((currentStage / totalStages) * 100)

  const getStageName = (stageNumber: number): string => {
    const stage = ONBOARDING_WORKFLOW_STAGES.find((s) => s.stage === stageNumber)
    if (!stage) return `Stage ${stageNumber}`

    // Map stage names to translations
    const stageNameMap: Record<string, string> = {
      image_upload: isRtl ? "تحميل الصور" : "Upload Images",
      vision_analysis: isRtl ? "تحليل الصور" : "Vision Analysis",
      group_confirmation: isRtl ? "تأكيد التجميع" : "Confirm Groups",
      product_generation: isRtl ? "إنشاء المنتجات" : "Generate Products",
      draft_preview: isRtl ? "عرض المسودات" : "Review Drafts",
      draft_editing: isRtl ? "تحرير المسودات" : "Edit Drafts",
      persistence: isRtl ? "حفظ المنتجات" : "Save Products",
    }

    return stageNameMap[stage.name] || stage.name
  }

  const getStageStatus = (stageNumber: number): "completed" | "active" | "pending" => {
    if (stageNumber < currentStage) return "completed"
    if (stageNumber === currentStage) return "active"
    return "pending"
  }

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            {isRtl ? `المرحلة ${currentStage} من ${totalStages}` : `Stage ${currentStage} of ${totalStages}`}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="space-y-2">
        {ONBOARDING_WORKFLOW_STAGES.map((stage) => {
          const status = getStageStatus(stage.stage)
          const isActive = status === "active"
          const isCompleted = status === "completed"

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: stage.stage * 0.05 }}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                isActive ? "bg-violet-50 dark:bg-violet-950/20" : "bg-muted/30",
                isRtl && "flex-row-reverse"
              )}
            >
              {/* Icon */}
              <div className="mt-0.5">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Circle className="w-5 h-5 text-green-500 fill-green-500" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Clock className="w-5 h-5 text-violet-500 fill-violet-500" />
                  </motion.div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : isCompleted ? "text-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {getStageName(stage.stage)}
                </p>
                <p
                  className={cn(
                    "text-xs leading-relaxed mt-0.5 transition-colors",
                    isActive ? "text-foreground/70" : isCompleted ? "text-muted-foreground/70" : "text-muted-foreground/50"
                  )}
                >
                  {stage.description}
                </p>
              </div>

              {/* Status Badge */}
              {isCompleted && <div className="text-xs font-medium text-green-600 whitespace-nowrap">✓ Done</div>}
              {isActive && (
                <div className="text-xs font-medium text-violet-600 whitespace-nowrap animate-pulse">
                  {isRtl ? "قيد التنفيذ" : "In Progress"}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Current Stage Name */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {isRtl ? "المرحلة الحالية:" : "Current stage:"}{" "}
          <span className="font-medium text-foreground">{getStageName(currentStage)}</span>
        </p>
      </div>
    </div>
  )
}
