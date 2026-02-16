"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConciergeProvider } from "@/components/admin-concierge/ConciergeProvider"
import { ConciergeFullPageLayout } from "@/components/admin-concierge/ConciergeFullPageLayout"
import { DraftApprovalScreen } from "@/components/admin-concierge/DraftApprovalScreen"
import type { OnboardingStatus } from "@/lib/ai/concierge-context"

// =============================================================================
// TYPES
// =============================================================================

type StartStep = "conversation" | "review"

interface StartPageClientProps {
  locale: string
  initialStep: StartStep
  storeId: string | null
  onboardingStatus: OnboardingStatus
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StartPageClient({
  locale,
  initialStep,
  storeId: initialStoreId,
  onboardingStatus,
}: StartPageClientProps) {
  const router = useRouter()
  const isRtl = locale === "ar"

  const [step, setStep] = useState<StartStep>(initialStep)
  const [storeId] = useState<string | null>(initialStoreId)

  // Handle skip → mark skipped, go to admin
  const handleSkip = () => {
    router.push(`/${locale}/admin`)
  }

  // Handle review completion → go to admin
  const handleComplete = () => {
    router.push(`/${locale}/admin`)
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
        {/* Progress steps */}
        <StepIndicator current={step} isRtl={isRtl} />

        {/* Skip button */}
        {step !== "review" && (
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{isRtl ? "تخطي" : "Skip"}</span>
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === "conversation" && storeId && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ConciergeProvider
              initialStoreState="empty"
              initialOnboardingStatus={onboardingStatus}
              storeId={storeId}
            >
              <ConciergeFullPageLayout
                storeId={storeId}
                onRequestReview={() => setStep("review")}
              />
            </ConciergeProvider>
          </motion.div>
        )}

        {step === "review" && storeId && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ConciergeProvider
              initialStoreState="draft"
              initialOnboardingStatus="in_progress"
              storeId={storeId}
            >
              <DraftApprovalScreen
                onBack={() => setStep("conversation")}
                onComplete={handleComplete}
              />
            </ConciergeProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// STEP INDICATOR
// =============================================================================

function StepIndicator({
  current,
  isRtl,
}: {
  current: StartStep
  isRtl: boolean
}) {
  const steps: { key: StartStep; label: string }[] = [
    { key: "conversation", label: isRtl ? "إعداد المتجر" : "Setup" },
    { key: "review", label: isRtl ? "مراجعة" : "Review" },
  ]

  const currentIndex = steps.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const isActive = s.key === current
        const isDone = i < currentIndex

        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "w-8 h-px",
                  isDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
