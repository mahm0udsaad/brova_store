"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformProgress } from "./platform-progress"
import { useTranslations } from "next-intl"

interface GenerationProgressProps {
  stage: "analyzing" | "generating" | "complete"
  progress: number
  selectedImages: string[]
  activePlatform: string | null
}

const STAGE_CONFIG = {
  analyzing: {
    messageKey: "marketingGenerator.progress.analyzing",
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  generating: {
    messageKey: "marketingGenerator.progress.generating",
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  complete: {
    messageKey: "marketingGenerator.progress.complete",
    color: "from-green-500 to-emerald-600",
    textColor: "text-green-600 dark:text-green-400",
  },
}

const SUBSTEPS = {
  analyzing: [
    "marketingGenerator.substeps.reading",
    "marketingGenerator.substeps.analyzingImages",
    "marketingGenerator.substeps.keyFeatures",
    "marketingGenerator.substeps.brandStyle"
  ],
  generating: [
    "marketingGenerator.substeps.facebook",
    "marketingGenerator.substeps.instagram",
    "marketingGenerator.substeps.tiktok",
    "marketingGenerator.substeps.hashtags",
    "marketingGenerator.substeps.ctas",
    "marketingGenerator.substeps.finalizing"
  ],
}

export function GenerationProgress({
  stage,
  progress,
  selectedImages,
  activePlatform,
}: GenerationProgressProps) {
  const t = useTranslations("admin")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeSubstep, setActiveSubstep] = useState(0)
  
  const currentStage = STAGE_CONFIG[stage]
  const substeps = SUBSTEPS[stage === "complete" ? "generating" : stage]

  useEffect(() => {
    if (selectedImages.length === 0) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [selectedImages.length])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSubstep((prev) => (prev + 1) % substeps.length)
    }, 800)
    return () => clearInterval(interval)
  }, [substeps.length])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border-2 bg-background overflow-hidden"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-50 blur-xl" />
        
        <div className="relative bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <div className={cn("px-6 py-4 bg-gradient-to-r bg-opacity-10", currentStage.color)}>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: stage === "complete" ? [0, 360] : 0 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
                  "bg-gradient-to-br", currentStage.color
                )}
              >
                {stage === "complete" ? (
                  <Check className="h-6 w-6 text-white" />
                ) : (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                )}
              </motion.div>
              
              <div className="flex-1">
                <p className="font-bold text-lg">{t(currentStage.messageKey)}</p>
                <p className="text-sm text-muted-foreground">
                  {stage === "complete"
                    ? t("marketingGenerator.progress.completeDetail")
                    : t("marketingGenerator.progress.percentComplete", { percent: Math.round(progress) })}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Progress Bar */}
            {stage !== "complete" && (
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", currentStage.color)}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}

            {/* Current Activity */}
            {selectedImages.length > 0 && stage !== "complete" && (
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-violet-500/50">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={selectedImages[currentImageIndex]}
                      alt={t("marketingGenerator.progress.productAlt")}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  </AnimatePresence>
                </div>
                
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeSubstep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-muted-foreground"
                    >
                      <Sparkles className="inline w-3 h-3 mr-1 text-violet-500" />
                      {t(substeps[activeSubstep])}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Platform Progress */}
            <PlatformProgress
              stage={stage}
              progress={progress}
              activePlatform={activePlatform}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
