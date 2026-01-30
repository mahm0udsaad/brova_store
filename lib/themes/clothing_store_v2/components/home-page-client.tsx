"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { LayoutGrid, SlidersHorizontal, Loader2 } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { ProductGridSkeleton } from '@/components/product-card-skeleton'
import { Header } from '@/components/header'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCart } from '@/hooks/use-cart'
import { triggerHaptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { NotificationPermissionModal } from '@/components/notification-permission-modal'
import { useModalStack } from '@/components/modal-stack/modal-stack-context'
import type { StorefrontProduct } from '@/lib/supabase/queries/storefront'
import { useTranslations } from 'next-intl'
import { CategoryTabs } from './category-tabs'
import { CategoryBentoGrid } from './category-bento-grid'
import { CategorySheetContent } from './category-sheet-content'
import type { CategoryOption } from './types'
import { ClothingStoreV2ProductCard } from '../product-card'
import styles from '../styles/theme.module.css'

const PRODUCTS_PER_PAGE = 12

interface HomePageClientProps {
  products: StorefrontProduct[]
  categories: CategoryOption[]
  locale: 'en' | 'ar'
  emptyMessage?: string
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

function getProductCategoryKeys(product: StorefrontProduct) {
  return [product.category, product.category_ar]
    .filter(Boolean)
    .map((value) => normalizeValue(value as string))
}

export default function HomePageClient({ products: initialProducts, categories, locale, emptyMessage }: HomePageClientProps) {
  const t = useTranslations('home')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'tabs' | 'bento'>('tabs')
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const { itemCount } = useCart()
  const { present } = useModalStack()
  const loaderRef = useRef<HTMLDivElement>(null)

  const normalizedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      matchKeys: category.matchKeys.map(normalizeValue),
    }))
  }, [categories])

  const categoriesWithAll = useMemo<CategoryOption[]>(() => {
    return [
      {
        id: 'all',
        label: t('categories.all'),
        subtitle: t('categories.shopAll'),
        matchKeys: [],
      },
      ...normalizedCategories,
    ]
  }, [normalizedCategories, t])

  const categoriesWithCounts = useMemo(() => {
    const counts = new Map<string, number>()
    categoriesWithAll.forEach((category) => {
      counts.set(category.id, 0)
    })

    initialProducts.forEach((product) => {
      const keys = getProductCategoryKeys(product)
      categoriesWithAll.forEach((category) => {
        if (category.id === 'all') return
        if (keys.some((key) => category.matchKeys.includes(key))) {
          counts.set(category.id, (counts.get(category.id) ?? 0) + 1)
        }
      })
    })

    counts.set('all', initialProducts.length)

    return categoriesWithAll.map((category) => ({
      ...category,
      count: counts.get(category.id) ?? 0,
    }))
  }, [categoriesWithAll, initialProducts])

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return initialProducts

    const category = categoriesWithAll.find((item) => item.id === activeCategory)
    if (!category) return initialProducts

    return initialProducts.filter((product) => {
      const keys = getProductCategoryKeys(product)
      return keys.some((key) => category.matchKeys.includes(key))
    })
  }, [activeCategory, categoriesWithAll, initialProducts])

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount])
  const hasMore = visibleCount < filteredProducts.length

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE)
    setIsLoading(false)
  }, [activeCategory])

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return
    setIsLoading(true)

    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PRODUCTS_PER_PAGE, filteredProducts.length))
      setIsLoading(false)
    }, 250)
  }, [filteredProducts.length, hasMore, isLoading])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoading])

  const handleLayoutClick = () => {
    triggerHaptic('light')
    setViewMode(viewMode === 'tabs' ? 'bento' : 'tabs')
  }

  const handleCategoryClick = () => {
    triggerHaptic('light')
    present(
      <CategorySheetContent
        categories={categoriesWithCounts}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    )
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    if (viewMode === 'bento') {
      setViewMode('tabs')
    }
  }

  return (
    <LayoutGroup>
      <div className={cn(styles.themeRoot, 'min-h-screen bg-background pt-14 pb-bottom-nav sm:pt-[72px]')}>
        <div className="max-w-md mx-auto px-3 md:max-w-2xl lg:max-w-6xl sm:px-4">
          <Header
            showLogo
            showThemeToggle={false}
            leftAction={
              <motion.button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-muted sm:w-10 sm:h-10"
                whileTap={{ scale: 0.9 }}
                onClick={handleCategoryClick}
                aria-label={t('filters')}
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            }
            rightAction={
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.button
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors sm:w-10 sm:h-10 ${
                    viewMode === 'bento' ? 'bg-foreground text-background' : 'bg-muted'
                  }`}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLayoutClick}
                  aria-label={t('toggleView')}
                >
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <ThemeToggle compact />
              </div>
            }
          />

          <motion.div
            className="my-4 sm:my-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 sm:text-xs sm:mb-1">
              {t('hero.kicker')}
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-balance sm:text-3xl">
              {t('hero.title')}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-1.5 max-w-md sm:text-sm sm:mt-2">
              {t('hero.subtitle')}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === 'bento' ? (
              <motion.div
                key="bento"
                className="mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CategoryBentoGrid
                  categories={categoriesWithCounts}
                  onCategorySelect={handleCategoryChange}
                  activeCategory={activeCategory}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tabs"
                className="mb-4 sm:mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CategoryTabs
                  categories={categoriesWithCounts}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && visibleProducts.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4"
                >
                  {visibleProducts.map((product) => (
                    <ClothingStoreV2ProductCard key={product.id} product={product} locale={locale} />
                  ))}
                </motion.div>
              </AnimatePresence>

              <div ref={loaderRef} className="py-8 flex justify-center">
                {isLoading && visibleProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t('loadingMore')}</span>
                  </motion.div>
                )}
                {!hasMore && visibleProducts.length > 0 && (
                  <p className="text-sm text-muted-foreground">{t('endOfList')}</p>
                )}
              </div>

              {visibleProducts.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <p className="text-muted-foreground">{emptyMessage || t('emptyState')}</p>
                </motion.div>
              )}
            </>
          )}
        </div>

        <BottomNav cartCount={itemCount} />
        <NotificationPermissionModal />
      </div>
    </LayoutGroup>
  )
}
