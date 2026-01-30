"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { triggerHaptic, playSound } from "@/lib/haptics"
import { useModalStack } from "./modal-stack/modal-stack-context"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CategorySheetContentProps {
  categories: { value: string; label: string }[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategorySheetContent({
  categories,
  activeCategory,
  onCategoryChange,
}: CategorySheetContentProps) {
  const { dismiss } = useModalStack()
  const locale = useLocale()
  const t = useTranslations("home")
  const isRtl = locale === "ar"

  const handleCategorySelect = (category: string) => {
    triggerHaptic("light")
    playSound("tap")
    onCategoryChange(category)
    dismiss()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-border mb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t("categories.title")}</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => dismiss()}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          aria-label={t("categories.close")}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <motion.button
            key={category.value}
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCategorySelect(category.value)}
            className={cn(
              "w-full text-left px-5 py-4 rounded-2xl transition-all duration-200",
              isRtl && "text-right",
              activeCategory === category.value
                ? "bg-foreground text-background font-semibold"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <span className="text-base">{category.label}</span>
            {activeCategory === category.value && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="float-right text-sm">
                {t("categories.selected")}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
