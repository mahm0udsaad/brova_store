"use client"

import { useState, useMemo } from "react"
import { LayoutGrid, SlidersHorizontal } from "lucide-react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { BottomNav } from "@/components/bottom-nav"
import { CategoryTabs } from "@/components/category-tabs"
import { CategoryBentoGrid } from "@/components/category-bento-grid"
import { ProductCard } from "@/components/product-card"
import { CategorySheetContent } from "@/components/category-sheet-content"
import { Header } from "@/components/header"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCart } from "@/hooks/use-cart"
import { triggerHaptic } from "@/lib/haptics"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { useModalStack } from "@/components/modal-stack/modal-stack-context"
import type { Product } from "@/types"

const categories = ["All", "Hoodies", "Joggers", "Shorts", "T-Shirts", "Accessories"]

interface HomePageClientProps {
  products: Product[]
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"tabs" | "bento">("tabs")
  const { itemCount } = useCart()
  const { present } = useModalStack()

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products
    return products.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase().replace("-", ""))
  }, [activeCategory, products])

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
      <div className="min-h-screen bg-background pt-[72px] pb-bottom-nav">
        <div className="max-w-md mx-auto px-4 md:max-w-2xl lg:max-w-6xl">
          {/* Header */}
          <Header
            showLogo
            showThemeToggle={false}
            leftAction={
              <motion.button
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-muted sm:w-10 sm:h-10"
                whileTap={{ scale: 0.9 }}
                onClick={handleCategoryClick}
                aria-label="Filter categories"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </motion.button>
            }
            rightAction={
              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors sm:w-10 sm:h-10 ${
                    viewMode === "bento" ? "bg-foreground text-background" : "bg-muted"
                  }`}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLayoutClick}
                  aria-label="Toggle category view"
                >
                  <LayoutGrid className="w-5 h-5" />
                </motion.button>
                <ThemeToggle compact />
              </div>
            }
          />

          {/* Hero Section */}
          <motion.div
            className="my-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Be Different</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-balance">
              Popular Products
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md">
              Never miss out on a hot release again with our latest drops newsletter.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === "bento" ? (
              <motion.div
                key="bento"
                className="mb-6"
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
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid - Responsive */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-muted-foreground">No products found in this category.</p>
            </motion.div>
          )}
        </div>

        <BottomNav cartCount={itemCount} />

        <OnboardingWizard />
      </div>
    </LayoutGroup>
  )
}
