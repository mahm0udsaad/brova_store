"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, X, Sparkles, Ruler, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"
import { springConfigs } from "@/lib/ui/motion-presets"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingSlide {
  id: string
  titleKey: string
  descriptionKey: string
  image: string | null
  icon?: React.ComponentType<{ className?: string }>
}

// =============================================================================
// COMPONENT
// =============================================================================

export function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("onboarding")
  const isRtl = locale === "ar"
  const [isMounted, setIsMounted] = useState(false)

  // Slide configurations
  const slides: OnboardingSlide[] = useMemo(() => [
    {
      id: "intro",
      titleKey: "intro.title",
      descriptionKey: "intro.description",
      image: null,
      icon: ShoppingBag,
    },
    {
      id: "try-on",
      titleKey: "tryOn.title",
      descriptionKey: "tryOn.description",
      image: "/marketing/try-on.png",
      icon: Sparkles,
    },
    {
      id: "measure",
      titleKey: "measure.title",
      descriptionKey: "measure.description",
      image: "/marketing/measurments.png",
      icon: Ruler,
    },
    {
      id: "prompt",
      titleKey: "prompt.title",
      descriptionKey: "prompt.description",
      image: "/marketing/measurments.png",
      icon: Ruler,
    },
  ], [])

  const currentSlide = slides[currentStep]
  const isLastStep = currentStep === slides.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    setIsMounted(true)
    const hasOnboarded = localStorage.getItem("store-onboarding-completed")
    if (!hasOnboarded) {
      // Small delay to let page load first
      const timer = setTimeout(() => setIsOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    triggerHaptic("light")
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleStartMeasurement()
    }
  }

  const handlePrevious = () => {
    triggerHaptic("light")
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    triggerHaptic("medium")
    localStorage.setItem("store-onboarding-completed", "true")
    setIsOpen(false)
  }

  const handleStartMeasurement = () => {
    triggerHaptic("success")
    localStorage.setItem("store-onboarding-completed", "true")
    setIsOpen(false)
    router.push(`/${locale}/measure`)
  }

  if (!isMounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="w-full max-w-md h-full max-h-[700px] flex flex-col relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={springConfigs.smooth}
          >
            {/* Skip button */}
            <motion.button
              onClick={handleSkip}
              className={cn(
                "absolute top-4 z-10 p-2.5 rounded-full bg-muted/80 backdrop-blur-sm hover:bg-muted transition-colors",
                isRtl ? "left-4" : "right-4"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t("skip")}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Progress Indicator */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, index) => (
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
                  layoutId={`progress-${index}`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col relative pt-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="flex-1 flex flex-col items-center justify-center px-8 text-center"
                  initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 30 : -30 }}
                  transition={springConfigs.smooth}
                >
                  {/* Image or Logo */}
                  <div className="mb-6 relative w-full aspect-[4/3] max-h-[280px] flex items-center justify-center">
                    {currentSlide.image ? (
                      <motion.div 
                        className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={springConfigs.gentle}
                      >
                        <Image
                          src={currentSlide.image}
                          alt={t(currentSlide.titleKey)}
                          fill
                          className="object-cover"
                          priority
                          sizes="(max-width: 768px) 100vw, 400px"
                          quality={90}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center gap-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={springConfigs.bouncy}
                      >
                        <div className="relative w-32 h-32">
                          <Image
                            src="/placeholder-logo.png"
                            alt="Store Logo"
                            fill
                            className="object-contain"
                            priority
                            sizes="128px"
                            quality={90}
                          />
                        </div>
                        {currentSlide.icon && (
                          <div className="p-4 rounded-2xl bg-primary/10">
                            <currentSlide.icon className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Text Content */}
                  <motion.div 
                    className="space-y-3 max-w-sm mx-auto"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, ...springConfigs.gentle }}
                  >
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {t(currentSlide.titleKey)}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      {t(currentSlide.descriptionKey)}
                    </p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gradient-to-t from-card to-card/80 backdrop-blur-sm border-t border-border/50">
              <div className="flex gap-3">
                {/* Back Button */}
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePrevious}
                    className="h-12 px-4 rounded-xl"
                  >
                    {isRtl ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </Button>
                )}
                
                {/* Next/Complete Button */}
                <Button 
                  className={cn(
                    "flex-1 h-12 text-base font-semibold rounded-xl gap-2",
                    isLastStep && "bg-gradient-to-r from-primary to-primary/90"
                  )}
                  size="lg"
                  onClick={handleNext}
                >
                  {isLastStep ? t("prompt.cta") : t("next")}
                  {!isLastStep && (
                    isRtl ? (
                      <ChevronLeft className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )
                  )}
                </Button>
              </div>
              
              {/* Skip link on last step */}
              {isLastStep && (
                <motion.button 
                  onClick={handleSkip}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {t("skipForNow")}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}