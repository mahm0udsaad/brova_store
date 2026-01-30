"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, MessageSquare, Loader2 } from "lucide-react"
import { useAdminAssistant } from "./AdminAssistantProvider"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { useLocale } from "next-intl"

export function AdminAssistantFab() {
  const { isOpen, toggle, isLoading, isGenerating, currentActivity } = useAdminAssistant()
  const locale = useLocale()
  const isRtl = locale === "ar"
  const isActive = isLoading || isGenerating

  return (
    <motion.div
      className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50 flex items-center gap-3"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springConfigs.gentle}
    >
      {/* Activity Status - Shows when AI is working */}
      <AnimatePresence>
        {isActive && !isOpen && (
          <motion.div
            initial={{ x: isRtl ? -20 : 20, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: isRtl ? -20 : 20, opacity: 0, scale: 0.9 }}
            transition={springConfigs.snappy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shadow-lg"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {currentActivity || (isRtl ? "AI يعمل..." : "AI working...")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={toggle}
        className={cn(
          "relative flex items-center justify-center rounded-2xl shadow-lg transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isOpen
            ? "h-12 w-12 bg-muted text-muted-foreground hover:bg-muted/80"
            : "h-14 px-5 bg-primary text-primary-foreground hover:bg-primary/90",
          isActive && !isOpen && "ring-2 ring-primary/30 ring-offset-2"
        )}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={springConfigs.snappy}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold hidden sm:inline">
                {isRtl ? "مساعد AI" : "AI Assistant"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Ring - Shows when AI can help */}
        {!isOpen && !isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{
              repeat: Infinity,
              repeatDelay: 3,
              duration: 1.5,
              ease: "easeOut",
            }}
          />
        )}

        {/* Activity Indicator Dot */}
        {isActive && !isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springConfigs.bouncy}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-success"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  )
}
