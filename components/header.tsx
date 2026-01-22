"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { triggerHaptic } from "@/lib/haptics"
import { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  showBack?: boolean
  title?: string
  showLogo?: boolean
  leftAction?: ReactNode
  rightAction?: ReactNode
  showThemeToggle?: boolean
}

export function Header({ 
  showBack = false, 
  title, 
  showLogo = false,
  leftAction,
  rightAction,
  showThemeToggle = true
}: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    triggerHaptic("light")
    router.back()
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-border/50 pt-safe-area-inset-top"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center justify-between py-2 px-3 max-w-md mx-auto lg:max-w-lg sm:py-4 sm:px-4">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {showBack && (
            <motion.button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors sm:w-10 sm:h-10"
              whileTap={{ scale: 0.9 }}
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          )}

          {leftAction}
        </div>
        {showLogo && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative w-10 h-10 sm:w-[90px] sm:h-[90px]"
            >
              <Image 
                src="/brova-logo-full.png" 
                alt="Brova Logo" 
                fill 
                className="object-contain rounded-full object-left dark:invert shadow-xl"
                priority
                sizes="(max-width: 640px) 40px, 90px"
                quality={90}
              />
            </motion.div>
          )}
        {title && (
          <motion.h1
            className="font-bold text-lg uppercase tracking-wider absolute left-1/2 -translate-x-1/2 sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.h1>
        )}

        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {rightAction}
          {showThemeToggle && <ThemeToggle compact />}
        </div>
      </div>
    </motion.header>
  )
}
