"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"

interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const handleCategoryClick = (category: string) => {
    triggerHaptic("light")
    onCategoryChange(category)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category, index) => {
        const isActive = activeCategory === category
        return (
          <motion.button
            key={category}
            onClick={() => handleCategoryClick(category)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              isActive ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-foreground rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {!isActive && <div className="absolute inset-0 bg-muted rounded-full" />}
            <span className="relative z-10">{category}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
