"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, CheckCircle2, Facebook, Instagram, Image, Wand2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface Product {
  id: string
  name: string
  image_url: string | null
}

interface MarketingGenerationIndicatorProps {
  isGenerating: boolean
  stage?: "analyzing" | "generating" | "complete"
  progress?: number
  className?: string
  products?: Product[]
  selectedImages?: string[]
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const stageConfig = {
  analyzing: {
    message: "Analyzing products & images",
    icon: Eye,
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  generating: {
    message: "Crafting engaging posts",
    icon: Wand2,
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  complete: {
    message: "Posts ready!",
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-600",
    textColor: "text-green-600 dark:text-green-400",
  },
}

const platforms = [
  { name: "Facebook", icon: Facebook, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { name: "Instagram", icon: Instagram, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  { name: "TikTok", icon: TikTokIcon, color: "text-gray-900 dark:text-white", bgColor: "bg-gray-500/10" },
]

export function MarketingGenerationIndicator({
  isGenerating,
  stage = "analyzing",
  progress = 0,
  className,
  products = [],
  selectedImages = [],
}: MarketingGenerationIndicatorProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeSubstep, setActiveSubstep] = useState(0)
  
  const currentStage = stageConfig[stage]
  const StageIcon = currentStage.icon

  // Rotate through product images
  useEffect(() => {
    if (!isGenerating || selectedImages.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length)
    }, 1500)
    
    return () => clearInterval(interval)
  }, [isGenerating, selectedImages.length])

  // Simulate substeps for more detailed progress
  useEffect(() => {
    if (!isGenerating) return
    
    const interval = setInterval(() => {
      setActiveSubstep((prev) => (prev + 1) % 6)
    }, 800)
    
    return () => clearInterval(interval)
  }, [isGenerating])

  if (!isGenerating && stage !== "complete") return null

  const substeps = stage === "analyzing" 
    ? ["Reading product details", "Analyzing images", "Identifying key features", "Understanding brand style"]
    : ["Crafting Facebook post", "Creating Instagram caption", "Generating TikTok script", "Adding hashtags", "Optimizing CTAs", "Finalizing posts"]

  const currentPlatformIndex = Math.floor((progress / 100) * platforms.length)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-[100]",
        "rounded-2xl border-2 bg-background shadow-2xl",
        "min-w-[400px] max-w-[500px]",
        "overflow-hidden",
        className
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-50 blur-xl" />
      
      <div className="relative bg-background/95 backdrop-blur-xl">
        {/* Header with gradient */}
        <div className={cn(
          "px-6 py-4 bg-gradient-to-r",
          currentStage.color,
          "bg-opacity-10"
        )}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                rotate: stage === "complete" ? [0, 360] : 0,
                scale: stage === "complete" ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.6 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-gradient-to-br",
                currentStage.color,
                "shadow-lg"
              )}
            >
              {stage === "complete" ? (
                <CheckCircle2 className="h-6 w-6 text-white" />
              ) : (
                <StageIcon className="h-6 w-6 text-white" />
              )}
            </motion.div>
            
            <div className="flex-1">
              <motion.p
                key={stage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-lg"
              >
                {currentStage.message}
              </motion.p>
              <p className="text-sm text-muted-foreground">
                {stage === "complete" 
                  ? "3 platform-optimized posts created"
                  : `${Math.round(progress)}% complete`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Progress Bar with gradient */}
          {stage !== "complete" && (
            <div className="relative">
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    "bg-gradient-to-r",
                    currentStage.color,
                    "shadow-lg"
                  )}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* Percentage label */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <motion.span
                  key={Math.floor(progress)}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    "bg-background border shadow-sm",
                    currentStage.textColor
                  )}
                >
                  {Math.round(progress)}%
                </motion.span>
              </div>
            </div>
          )}

          {/* Product images carousel */}
          {selectedImages.length > 0 && stage !== "complete" && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-violet-500/50 shadow-lg">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={selectedImages[currentImageIndex]}
                      alt="Product"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0, scale: 1.2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                    />
                  </AnimatePresence>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {currentImageIndex + 1}/{selectedImages.length}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeSubstep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-muted-foreground truncate"
                  >
                    <Sparkles className="inline w-3 h-3 mr-1 text-violet-500" />
                    {substeps[activeSubstep % substeps.length]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Platform Progress */}
          <div className="space-y-2">
            {platforms.map((platform, index) => {
              const Icon = platform.icon
              const isActive = stage === "generating" && index <= currentPlatformIndex
              const isComplete = stage === "complete" || (stage === "generating" && index < currentPlatformIndex)
              const isCurrent = stage === "generating" && index === currentPlatformIndex
              
              return (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all",
                    isCurrent ? "border-violet-500 bg-violet-500/5 scale-105" : "",
                    isComplete ? "border-green-500/30 bg-green-500/5" : "",
                    !isActive && !isComplete ? "opacity-40" : ""
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    platform.bgColor,
                    isCurrent && "ring-2 ring-violet-500 ring-offset-2 ring-offset-background"
                  )}>
                    <Icon className={cn("w-4 h-4", platform.color)} />
                  </div>
                  
                  <span className="flex-1 text-sm font-medium">
                    {platform.name}
                  </span>
                  
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  )}
                  
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Products being analyzed */}
          {products.length > 0 && stage === "analyzing" && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Analyzing {products.length} product{products.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {products.slice(0, 4).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-muted"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                ))}
                {products.length > 4 && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">+{products.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Dashboard-wide indicator for marketing generation in progress
 * Shows a compact notification in the top bar
 */
export function MarketingGenerationBadge() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm"
    >
      <Sparkles className="w-4 h-4 animate-pulse" />
      <span className="font-medium">AI Working...</span>
    </motion.div>
  )
}
