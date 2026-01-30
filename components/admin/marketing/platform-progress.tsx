"use client"

import { motion } from "framer-motion"
import { Facebook, Instagram, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const PLATFORMS = [
  { 
    key: "facebook", 
    labelKey: "marketingGenerator.platforms.facebook",
    icon: Facebook, 
    color: "text-blue-600", 
    bgColor: "bg-blue-50 dark:bg-blue-950/30" 
  },
  { 
    key: "instagram", 
    labelKey: "marketingGenerator.platforms.instagram",
    icon: Instagram, 
    color: "text-pink-600", 
    bgColor: "bg-pink-50 dark:bg-pink-950/30" 
  },
  { 
    key: "tiktok", 
    labelKey: "marketingGenerator.platforms.tiktok",
    icon: TikTokIcon, 
    color: "text-gray-900 dark:text-white", 
    bgColor: "bg-gray-50 dark:bg-gray-950/30" 
  },
]

interface PlatformProgressProps {
  stage: "analyzing" | "generating" | "complete"
  progress: number
  activePlatform: string | null
}

export function PlatformProgress({ stage, progress, activePlatform }: PlatformProgressProps) {
  const t = useTranslations("admin")
  const currentPlatformIndex = Math.floor((progress / 100) * 3)

  return (
    <div className="grid grid-cols-3 gap-2">
      {PLATFORMS.map((platform, index) => {
        const Icon = platform.icon
        const isActive = stage === "generating" && platform.key === activePlatform
        const isComplete = stage === "complete" || index < currentPlatformIndex
        
        return (
          <div
            key={platform.key}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              isActive && "border-violet-500 bg-violet-500/10 scale-105",
              isComplete && "border-green-500/30 bg-green-500/5",
              !isActive && !isComplete && "opacity-40"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", platform.bgColor)}>
              <Icon className={cn("w-4 h-4", platform.color)} />
            </div>
            <span className="flex-1 text-xs font-medium">{t(platform.labelKey)}</span>
            {isActive && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
            {isComplete && <Check className="w-4 h-4 text-green-500" />}
          </div>
        )
      })}
    </div>
  )
}
