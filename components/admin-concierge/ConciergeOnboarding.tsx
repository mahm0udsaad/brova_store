"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  X,
  SkipForward,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { springConfigs, motionPresets } from "@/lib/ui/motion-presets"
import { useConcierge } from "./ConciergeProvider"
import { ConciergeWelcome } from "./ConciergeWelcome"
import { ConciergeConversation } from "./ConciergeConversation"
import { DraftPreview } from "./DraftPreview"
import { DraftApprovalScreen } from "./DraftApprovalScreen"

// =============================================================================
// TYPES
// =============================================================================

type OnboardingPhase = "welcome" | "conversation" | "review"

// =============================================================================
// COMPONENT
// =============================================================================

export function ConciergeOnboarding() {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const isRtl = locale === "ar"
  
  const {
    isOnboardingActive,
    onboardingStatus,
    currentStep,
    draftState,
    context,
    startOnboarding,
    skipOnboarding,
    setCurrentStep,
  } = useConcierge()
  
  const [phase, setPhase] = useState<OnboardingPhase>("welcome")
  const [isVisible, setIsVisible] = useState(false)
  
  // Check if we should show onboarding
  useEffect(() => {
    // Show onboarding if status is not_started or in_progress
    if (onboardingStatus === "not_started" || onboardingStatus === "in_progress") {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [onboardingStatus])
  
  // Handle start
  const handleStart = () => {
    startOnboarding()
    setPhase("conversation")
  }
  
  // Handle skip
  const handleSkip = () => {
    skipOnboarding()
    setIsVisible(false)
  }
  
  // Handle phase transitions
  const handlePhaseChange = (newPhase: OnboardingPhase) => {
    setPhase(newPhase)
    if (newPhase === "review") {
      setCurrentStep("review")
    }
  }
  
  if (!isVisible) return null
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--primary)_0%,_transparent_50%)] opacity-[0.02]" />
        
        {/* Main container */}
        <motion.div
          className={cn(
            "relative w-full max-w-5xl h-[90vh] max-h-[800px] mx-4",
            "flex rounded-3xl overflow-hidden",
            "bg-card border border-border shadow-2xl",
            isRtl ? "flex-row-reverse" : "flex-row"
          )}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={springConfigs.smooth}
        >
          {/* Skip button */}
          <motion.button
            onClick={handleSkip}
            className={cn(
              "absolute top-4 z-20 p-2.5 rounded-full",
              "bg-muted/80 backdrop-blur-sm hover:bg-muted transition-colors",
              isRtl ? "left-4" : "right-4"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("welcome.skipButton")}
          >
            <X className="w-5 h-5" />
          </motion.button>
          
          {/* Left Panel: Main Content */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0",
            phase !== "review" && "border-border",
            phase !== "review" && (isRtl ? "border-l" : "border-r")
          )}>
            <AnimatePresence mode="wait">
              {phase === "welcome" ? (
                <ConciergeWelcome 
                  key="welcome"
                  onStart={handleStart}
                  onSkip={handleSkip}
                />
              ) : phase === "review" ? (
                <DraftApprovalScreen
                  key="review"
                  onBack={() => handlePhaseChange("conversation")}
                />
              ) : (
                <ConciergeConversation 
                  key="conversation"
                  onRequestReview={() => handlePhaseChange("review")}
                  context={context}
                />
              )}
            </AnimatePresence>
          </div>
          
          {/* Right Panel: Live Preview (hidden during review) */}
          {phase !== "review" && (
            <div className={cn(
              "w-[400px] shrink-0 bg-muted/30",
              "flex flex-col",
              // Hide on mobile
              "hidden lg:flex"
            )}>
              <DraftPreview />
            </div>
          )}
        </motion.div>
        
        {/* Safety message */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("safety.draftOnly")}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// PROGRESS INDICATOR
// =============================================================================

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === currentStep
              ? "w-6 bg-primary"
              : index < currentStep
                ? "w-1.5 bg-primary/50"
                : "w-1.5 bg-muted-foreground/30"
          )}
          layoutId={`progress-dot-${index}`}
        />
      ))}
    </div>
  )
}
