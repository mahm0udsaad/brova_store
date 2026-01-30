"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { Sparkles, Sun, Moon, CloudSun } from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

interface WelcomeSectionProps {
  storeName?: string
  subtitle?: string
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function getGreeting(): { text: string; icon: React.ComponentType<{ className?: string }> } {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", icon: Sun }
  } else if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", icon: CloudSun }
  } else if (hour >= 17 && hour < 21) {
    return { text: "Good evening", icon: CloudSun }
  } else {
    return { text: "Good night", icon: Moon }
  }
}

function getArabicGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return "صباح الخير"
  } else if (hour >= 12 && hour < 17) {
    return "مساء الخير"
  } else if (hour >= 17 && hour < 21) {
    return "مساء الخير"
  } else {
    return "مساء الخير"
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WelcomeSection({
  storeName,
  subtitle,
  className,
}: WelcomeSectionProps) {
  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  return (
    <motion.div
      className={cn("space-y-1", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
    >
      {/* Greeting */}
      <div className="flex items-center gap-2">
        <GreetingIcon className="w-5 h-5 text-warning" />
        <span className="text-sm font-medium text-muted-foreground">
          {greeting.text}
        </span>
      </div>

      {/* Store Name */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        {storeName || "Your Store"}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground max-w-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

// =============================================================================
// BILINGUAL WELCOME SECTION
// =============================================================================

interface BilingualWelcomeSectionProps extends Omit<WelcomeSectionProps, "subtitle"> {
  subtitleEn?: string
  subtitleAr?: string
  locale?: string
}

export function BilingualWelcomeSection({
  storeName,
  subtitleEn = "Here's what's happening with your store today",
  subtitleAr = "إليك ما يحدث في متجرك اليوم",
  locale = "en",
  className,
}: BilingualWelcomeSectionProps) {
  const isArabic = locale === "ar"
  const greeting = isArabic ? getArabicGreeting() : getGreeting().text
  const subtitle = isArabic ? subtitleAr : subtitleEn
  const GreetingIcon = getGreeting().icon

  return (
    <motion.div
      className={cn("space-y-1", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
    >
      {/* Greeting */}
      <div className="flex items-center gap-2">
        <GreetingIcon className="w-5 h-5 text-warning" />
        <span className="text-sm font-medium text-muted-foreground">
          {greeting}
        </span>
      </div>

      {/* Store Name */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        {storeName || (isArabic ? "متجرك" : "Your Store")}
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground max-w-lg">
        {subtitle}
      </p>
    </motion.div>
  )
}
