"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { LayoutGrid, SlidersHorizontal, Loader2 } from "lucide-react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { BottomNav } from "@/components/bottom-nav"
import { CategoryTabs } from "@/components/category-tabs"
import { CategoryBentoGrid } from "@/components/category-bento-grid"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { CategorySheetContent } from "@/components/category-sheet-content"
import { Header } from "@/components/header"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCart } from "@/hooks/use-cart"
import { triggerHaptic } from "@/lib/haptics"
import { NotificationPermissionModal } from "@/components/notification-permission-modal"
import { useModalStack } from "@/components/modal-stack/modal-stack-context"
import type { Product } from "@/types"
import { useTranslations } from "next-intl"

const PRODUCTS_PER_PAGE = 12

interface HomePageClientProps {
  products: Product[]
}

export default function HomePageClient({ products: initialProducts }: HomePageClientProps) {
  const t = useTranslations("home")
  const categories = useMemo(
    () => [
      { value: "All", label: t("categories.all") },
      { value: "Hoodies", label: t("categories.hoodies") },
      { value: "Joggers", label: t("categories.joggers") },
      { value: "Shorts", label: t("categories.shorts") },
      { value: "T-Shirts", label: t("categories.tShirts") },
      { value: "Accessories", label: t("categories.accessories") },
    ],
    [t]
  )
  const [activeCategory, setActiveCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"tabs" | "bento">("tabs")
  const [products, setProducts] = useState<Product[]>(initialProducts.slice(0, PRODUCTS_PER_PAGE))
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length > PRODUCTS_PER_PAGE)
  const [offset, setOffset] = useState(PRODUCTS_PER_PAGE)
  const { itemCount } = useCart()
  const { present } = useModalStack()
  const loaderRef = useRef<HTMLDivElement>(null)

  // Reset when category changes
  useEffect(() => {
    const fetchInitialProducts = async () => {
      setIsLoading(true)
      setProducts([])
      setOffset(0)

      try {
        const res = await fetch(`/api/products?limit=${PRODUCTS_PER_PAGE}&offset=0&category=${activeCategory}`)
        const data = await res.json()
        setProducts(data.products)
        setHasMore(data.hasMore)
        setOffset(data.products.length)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialProducts()
  }, [activeCategory])

  // Infinite scroll with Intersection Observer
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/products?limit=${PRODUCTS_PER_PAGE}&offset=${offset}&category=${activeCategory}`)
      const data = await res.json()
      setProducts((prev) => [...prev, ...data.products])
      setHasMore(data.hasMore)
      setOffset((prev) => prev + data.products.length)
    } catch (error) {
      console.error("Failed to load more products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset, activeCategory])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoading])

  const handleLayoutClick = () => {
    triggerHaptic("light")
    setViewMode(viewMode === "tabs" ? "bento" : "tabs")
  }

  const handleCategoryClick = () => {
    triggerHaptic("light")
    present(
      <CategorySheetContent
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    )
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    if (viewMode === "bento") {
      setViewMode("tabs")
    }
  }

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-background pt-14 pb-bottom-nav sm:pt-[72px]">
        <div className="max-w-md mx-auto px-3 md:max-w-2xl lg:max-w-6xl sm:px-4">
          {/* Header */}
          <Header
            showLogo
            showThemeToggle={false}
            leftAction={
              <motion.button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-muted sm:w-10 sm:h-10"
                whileTap={{ scale: 0.9 }}
                onClick={handleCategoryClick}
                aria-label={t("filters")}
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            }
            rightAction={
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.button
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors sm:w-10 sm:h-10 ${
                    viewMode === "bento" ? "bg-foreground text-background" : "bg-muted"
                  }`}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLayoutClick}
                  aria-label={t("toggleView")}
                >
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <ThemeToggle compact />
              </div>
            }
          />

          {/* Hero Section */}
          <motion.div
            className="my-4 sm:my-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 sm:text-xs sm:mb-1">
              {t("hero.kicker")}
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-balance sm:text-3xl">
              {t("hero.title")}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-1.5 max-w-md sm:text-sm sm:mt-2">
              {t("hero.subtitle")}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === "bento" ? (
              <motion.div
                key="bento"
                className="mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CategoryBentoGrid onCategorySelect={handleCategoryChange} activeCategory={activeCategory} />
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
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid - Initial Loading */}
          {isLoading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <>
              {/* Products Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4"
                >
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Load More Trigger */}
              <div ref={loaderRef} className="py-8 flex justify-center">
                {isLoading && products.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t("loadingMore")}</span>
                  </motion.div>
                )}
                {!hasMore && products.length > 0 && (
                  <p className="text-sm text-muted-foreground">{t("endOfList")}</p>
                )}
              </div>

              {/* Empty State */}
              {products.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <p className="text-muted-foreground">{t("emptyState")}</p>
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
