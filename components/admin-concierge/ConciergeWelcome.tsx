"use client"

import { motion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { Sparkles, ArrowRight, ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { springConfigs, staggerContainerVariants, staggerItemVariants } from "@/lib/ui/motion-presets"

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeWelcomeProps {
  onStart: () => void
  onSkip: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConciergeWelcome({ onStart, onSkip }: ConciergeWelcomeProps) {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const isRtl = locale === "ar"
  
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
      variants={staggerContainerVariants(0.1, 0.2)}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Logo / Icon */}
      <motion.div
        className="relative mb-8"
        variants={staggerItemVariants}
      >
        <div className={cn(
          "w-20 h-20 rounded-3xl",
          "bg-gradient-to-br from-primary/10 to-primary/5",
          "flex items-center justify-center",
          "ring-1 ring-primary/20"
        )}>
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        {/* Subtle pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      
      {/* Welcome Text */}
      <motion.div
        className="space-y-4 max-w-md"
        variants={staggerItemVariants}
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {t("welcome.greeting")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("welcome.subtitle")}
        </p>
      </motion.div>
      
      {/* Reassurance */}
      <motion.div
        className="mt-8 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50"
        variants={staggerItemVariants}
      >
        <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          {t("welcome.reassurance")}
        </p>
      </motion.div>
      
      {/* Actions */}
      <motion.div
        className="mt-10 flex flex-col gap-3 w-full max-w-xs"
        variants={staggerItemVariants}
      >
        <Button
          size="lg"
          className="h-14 text-base font-semibold rounded-xl gap-3"
          onClick={onStart}
        >
          {t("welcome.startButton")}
          {isRtl ? (
            <ArrowLeft className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          className="h-12 text-base text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          {t("welcome.skipButton")}
        </Button>
      </motion.div>
      
      {/* Features preview - subtle */}
      <motion.div
        className="mt-12 grid grid-cols-3 gap-6 text-center"
        variants={staggerItemVariants}
      >
        {[
          { 
            emoji: "🎨", 
            label: isRtl ? "المظهر" : "Appearance" 
          },
          { 
            emoji: "📦", 
            label: isRtl ? "المنتجات" : "Products" 
          },
          { 
            emoji: "✨", 
            label: isRtl ? "العلامة" : "Brand" 
          },
        ].map((feature, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <span className="text-2xl">{feature.emoji}</span>
            <span className="text-xs text-muted-foreground">{feature.label}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
