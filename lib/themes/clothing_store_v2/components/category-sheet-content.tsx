"use client"

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { triggerHaptic, playSound } from '@/lib/haptics'
import { useModalStack } from '@/components/modal-stack/modal-stack-context'
import type { CategoryOption } from './types'
import { useTranslations } from 'next-intl'

interface CategorySheetContentProps {
  categories: CategoryOption[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategorySheetContent({
  categories,
  activeCategory,
  onCategoryChange,
}: CategorySheetContentProps) {
  const { dismiss } = useModalStack()
  const t = useTranslations('home')

  const handleCategorySelect = (categoryId: string) => {
    triggerHaptic('light')
    playSound('tap')
    onCategoryChange(categoryId)
    dismiss()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-4 border-b border-border mb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t('categories.title')}</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => dismiss()}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          aria-label={t('categories.close')}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="space-y-2">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCategorySelect(category.id)}
            className={`w-full text-left rtl:text-right px-5 py-4 rounded-2xl transition-all duration-200 ${
              activeCategory === category.id
                ? 'bg-foreground text-background font-semibold'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <span className="text-base">{category.label}</span>
            {activeCategory === category.id && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="float-right text-sm">
                {t('categories.selected')}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
