"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { triggerHaptic } from "@/lib/haptics"
import { ReactNode } from "react"

interface HeaderProps {
  showBack?: boolean
  title?: string
  showLogo?: boolean
  leftAction?: ReactNode
  rightAction?: ReactNode
}

export function Header({ 
  showBack = false, 
  title, 
  showLogo = false,
  leftAction,
  rightAction
}: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    triggerHaptic("light")
    router.back()
  }

  return (
    <motion.header
      className="flex items-center justify-between py-4 px-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center justify-between gap-3">
        {showBack && (
          <motion.button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            whileTap={{ scale: 0.9 }}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}

        {leftAction}
      </div>
      {showLogo && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-[90px] h-[90px]"
          >
            <Image 
              src="/brova-logo-full.png" 
              alt="Brova Logo" 
              fill 
              className="object-contain rounded-full object-left dark:invert shadow-xl"
              priority
            />
          </motion.div>
        )}
      {title && (
        <motion.h1
          className="font-bold text-xl uppercase tracking-wider absolute left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h1>
      )}

      {rightAction && <div className="flex items-center justify-center">
        {rightAction}
      </div>}
    </motion.header>
  )
}
