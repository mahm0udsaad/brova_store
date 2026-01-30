"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { triggerHaptic, playSound } from "@/lib/haptics"

interface CategoryBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryBottomSheet({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryBottomSheetProps) {
  const handleCategorySelect = (category: string) => {
    triggerHaptic("light")
    playSound("tap")
    onCategoryChange(category)
    onClose()
  }

  const handleClose = () => {
    triggerHaptic("light")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[70vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold uppercase tracking-tight">Categories</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Category List */}
            <div className="p-6 space-y-2 overflow-y-auto max-h-[50vh]">
              {categories.map((category, index) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 ${
                    activeCategory === category
                      ? "bg-foreground text-background font-semibold"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <span className="text-base">{category}</span>
                  {activeCategory === category && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="float-right text-sm">
                      Selected
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
