"use client"

import Image from 'next/image'
import { motion } from 'framer-motion'
import { triggerHaptic } from '@/lib/haptics'
import { blurPlaceholders } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'
import type { CategoryOption } from './types'

interface CategoryBentoGridProps {
  categories: CategoryOption[]
  activeCategory: string
  onCategorySelect: (categoryId: string) => void
}

export function CategoryBentoGrid({ categories, activeCategory, onCategorySelect }: CategoryBentoGridProps) {
  const t = useTranslations('home')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const handleCategoryClick = (categoryId: string) => {
    triggerHaptic('light')
    onCategorySelect(categoryId)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {categories.map((category, index) => {
        const isActive = activeCategory === category.id
        const isAll = category.id === 'all'

        if (isAll) {
          return (
            <motion.button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'col-span-2 md:col-span-1 relative aspect-[2/1] md:aspect-square rounded-2xl overflow-hidden group',
                isActive && 'ring-2 ring-foreground'
              )}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/20 to-foreground/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl md:text-xl font-bold uppercase tracking-tight">{category.label}</p>
                  <p className="text-xs text-muted-foreground">{category.subtitle || t('categories.shopAll')}</p>
                </div>
              </div>
            </motion.button>
          )
        }

        return (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={cn(
              'relative aspect-square rounded-2xl overflow-hidden group',
              isActive && 'ring-2 ring-foreground'
            )}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (index + 1) * 0.05 }}
          >
            <Image
              src={category.imageUrl || '/placeholder.svg'}
              alt={category.label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              quality={85}
              placeholder="blur"
              blurDataURL={blurPlaceholders.square}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className={cn('absolute inset-x-0 bottom-0 p-3', isRtl && 'text-right')}>
              <p className="text-sm font-bold uppercase tracking-tight">{category.label}</p>
              <p className="text-xs text-muted-foreground">{t('categories.items', { count: category.count ?? 0 })}</p>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
