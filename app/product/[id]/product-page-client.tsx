"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { ProductImageSlider } from "@/components/product-image-slider"
import { TryOnSheetContent } from "@/components/try-on-sheet-content"
import { useModalStack } from "@/components/modal-stack/modal-stack-context"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { PhoneAuthModal } from "@/components/phone-auth-modal"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"
import { toggleFavorite, isFavorite } from "@/lib/favorites"
import { cn } from "@/lib/utils"
import { Check, ShoppingBag, Heart, Share2 } from "lucide-react"
import type { Product } from "@/types"

interface ProductPageClientProps {
  product: Product
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const router = useRouter()
  const { addToCart, itemCount } = useCart()
  const { present } = useModalStack()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingTryOn, setPendingTryOn] = useState(false)

  useEffect(() => {
    setIsFav(isFavorite(product.id))
    window.scrollTo(0, 0)
  }, [product])

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image]
  const isPurchasable = typeof product.price === "number" && product.price > 0

  const handleSizeSelect = (size: string) => {
    triggerHaptic("light")
    setSelectedSize(size)
  }

  const handleAddToCart = () => {
    if (!selectedSize || !isPurchasable) return

    setIsAdding(true)
    triggerHaptic("medium")

    addToCart(product, selectedSize)

    setTimeout(() => {
      setIsAdding(false)
      setShowAdded(true)
      triggerHaptic("success")
      playSuccessSound()

      setTimeout(() => {
        router.push("/cart")
      }, 800)
    }, 400)
  }

  const handleTryOn = () => {
    if (!isAuthenticated && !authLoading) {
      setPendingTryOn(true)
      setShowAuthModal(true)
      return
    }
    present(
      <TryOnSheetContent 
        productImage={productImages[0]}
        productName={product.name}
        productId={product.id}
      />
    )
  }

  const handleShare = async () => {
    triggerHaptic("light")

    const shareData = {
      title: product.name,
      text: isPurchasable
        ? `Check out ${product.name} at Brova - EGP ${product.price?.toLocaleString()}`
        : `Check out ${product.name} at Brova`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        playSuccessSound()
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      triggerHaptic("success")
      playSuccessSound()
    }
  }

  const handleFavoriteToggle = () => {
    triggerHaptic("medium")
    const newState = toggleFavorite(product.id)
    setIsFav(newState)
    if (newState) {
      playSuccessSound()
    }
  }

  return (
    <LayoutGroup>
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-md mx-auto lg:max-w-6xl lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="relative">
            <div className="lg:hidden">
              <Header showBack />
            </div>

            <motion.div
              layoutId={`product-image-${product.id}`}
              className="relative w-full lg:sticky lg:top-0 lg:mt-8"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ProductImageSlider images={productImages} productName={product.name} onTryOn={handleTryOn} />
            </motion.div>
          </div>

          <div className="px-4 py-6 lg:py-8">
            <div className="hidden lg:block mb-6">
              <Header showBack />
            </div>

            <motion.div
              className="flex items-center justify-between mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{product.category}</p>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                  aria-label="Share product"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleFavoriteToggle}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isFav ? "bg-red-500/20 text-red-500" : "bg-muted",
                  )}
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              layoutId={`product-info-${product.id}`}
            >
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-3 text-balance">
                {product.name}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            </motion.div>

            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-semibold mb-3">Select Size</p>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size, index) => (
                  <motion.button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 font-semibold transition-all duration-200",
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/50",
                    )}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {!selectedSize && product.sizes.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-muted-foreground mt-2"
                  >
                    Please select a size to continue
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex-1">
                {isPurchasable ? (
                  <p className="text-3xl md:text-4xl font-bold">EGP {product.price?.toLocaleString()}</p>
                ) : (
                  <p className="text-lg md:text-xl font-semibold text-muted-foreground">Pricing soon</p>
                )}
              </div>

              <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-16 text-base font-semibold relative overflow-hidden"
                  disabled={!selectedSize || isAdding || !isPurchasable}
                  onClick={handleAddToCart}
                >
                  <AnimatePresence mode="wait">
                    {showAdded ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Added!
                      </motion.span>
                    ) : isAdding ? (
                      <motion.span
                        key="adding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <ShoppingBag className="w-5 h-5" />
                        </motion.div>
                        Adding...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <BottomNav cartCount={itemCount} />
      </motion.div>
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          if (pendingTryOn) {
            setPendingTryOn(false)
            present(
              <TryOnSheetContent 
                productImage={productImages[0]}
                productName={product.name}
                productId={product.id}
              />
            )
          }
        }}
      />
    </LayoutGroup>
  )
}
