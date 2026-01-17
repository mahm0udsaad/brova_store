"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"

const slides = [
  {
    id: "intro",
    title: "Welcome to Brova",
    description: "Experience modern streetwear like never before.",
    image: null,
  },
  {
    id: "try-on",
    title: "AI Try On",
    description: "See exactly how it looks on you before you buy. Our AI technology visualizes the fit perfectly.",
    image: "/marketing/try-on.png",
  },
  {
    id: "measure",
    title: "Measure Your Fit",
    description: "Get personalized size recommendations based on your exact body measurements.",
    image: "/marketing/measurments.png",
  },
  {
    id: "prompt",
    title: "Find Your Perfect Fit",
    description: "To recommend the best products for you, we need your measurements. It only takes a minute.",
    image: "/marketing/measurments.png", // Reuse or use a different graphic if needed
  },
]

export function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const hasOnboarded = localStorage.getItem("brova-onboarding-completed")
    if (!hasOnboarded) {
      // Small delay to let page load first
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    triggerHaptic("light")
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleStartMeasurement()
    }
  }

  const handleSkip = () => {
    triggerHaptic("medium")
    localStorage.setItem("brova-onboarding-completed", "true")
    setIsOpen(false)
  }

  const handleStartMeasurement = () => {
    triggerHaptic("success")
    localStorage.setItem("brova-onboarding-completed", "true")
    setIsOpen(false)
    router.push("/measure")
  }

  if (!isMounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full max-w-md h-full max-h-[800px] flex flex-col relative bg-card border rounded-3xl shadow-2xl overflow-hidden">
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / slides.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex-1 flex flex-col relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image or Logo */}
                  <div className="mb-8 relative w-full aspect-square max-h-[300px] flex items-center justify-center">
                    {slides[currentStep].image ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                        <Image
                          src={slides[currentStep].image!}
                          alt={slides[currentStep].title}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="relative w-48 h-48">
                         <Image
                          src="/brova-logo-full.png"
                          alt="Brova Logo"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="space-y-4 max-w-xs mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight uppercase">
                      {slides[currentStep].title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {slides[currentStep].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-6 bg-background/50 backdrop-blur-sm border-t">
              <div className="flex gap-4">
                {currentStep === slides.length - 1 ? (
                   <Button 
                    className="w-full h-14 text-lg font-semibold rounded-xl" 
                    size="lg"
                    onClick={handleStartMeasurement}
                  >
                    Set Up My Fit
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-14 text-lg font-semibold rounded-xl group" 
                    size="lg"
                    onClick={handleNext}
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
              
              {currentStep === slides.length - 1 && (
                <button 
                  onClick={handleSkip}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  I'll do this later
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
