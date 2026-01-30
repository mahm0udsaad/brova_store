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
import { Check, ShoppingBag, Heart, Share2, Sparkles, TrendingUp } from "lucide-react"
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setIsFav(isFavorite(product.id))
    window.scrollTo(0, 0)
  }, [product])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-[72px] pb-bottom-nav relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Ambient background gradient that follows mouse */}
        <motion.div
          className="pointer-events-none fixed inset-0 opacity-30"
          animate={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(var(--primary-rgb, 0, 0, 0), 0.1), transparent 80%)`
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />

        <div className="max-w-md mx-auto lg:max-w-7xl lg:grid lg:grid-cols-2 lg:gap-16 lg:px-8 relative z-10">
          <div className="relative">
            <div className="lg:hidden">
              <Header showBack />
            </div>

            <motion.div
              layoutId={`product-image-${product.id}`}
              className="relative w-full lg:sticky lg:top-[88px] lg:mt-8"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ProductImageSlider images={productImages} productName={product.name} onTryOn={handleTryOn} />
            </motion.div>
          </div>

          <div className="px-6 py-8 lg:py-12">
            <div className="hidden lg:block mb-8">
              <Header showBack />
            </div>

            {/* Category and Actions Bar */}
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-xl border border-primary/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-medium text-primary uppercase tracking-wider">{product.category}</p>
              </motion.div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="w-11 h-11 rounded-2xl bg-muted/80 backdrop-blur-xl border border-border/50 flex items-center justify-center hover:bg-muted transition-all duration-300 hover:shadow-lg"
                  aria-label="Share product"
                >
                  <Share2 className="w-4.5 h-4.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleFavoriteToggle}
                  className={cn(
                    "w-11 h-11 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all duration-300",
                    isFav 
                      ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30 text-red-500 shadow-lg shadow-red-500/20" 
                      : "bg-muted/80 border-border/50 hover:bg-muted hover:shadow-lg",
                  )}
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <motion.div
                    animate={isFav ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={cn("w-4.5 h-4.5", isFav && "fill-current")} />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>

            {/* Product Title and Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              layoutId={`product-info-${product.id}`}
              className="space-y-4 mb-8"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/70">
                {product.name}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground/90 leading-relaxed max-w-xl">
                {product.description}
              </p>
            </motion.div>

            {/* Size Selection */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm font-semibold tracking-wide">Select Size</p>
                <AnimatePresence>
                  {selectedSize && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      <Check className="w-3 h-3" />
                      {selectedSize}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size, index) => (
                  <motion.button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + index * 0.04 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative w-16 h-16 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group",
                      selectedSize === size
                        ? "bg-gradient-to-br from-foreground to-foreground/90 text-background shadow-xl shadow-foreground/20 border-2 border-foreground"
                        : "bg-muted/50 backdrop-blur-sm border-2 border-border/50 text-foreground hover:border-foreground/30 hover:shadow-lg hover:bg-muted",
                    )}
                  >
                    <span className="relative z-10">{size}</span>
                    {selectedSize !== size && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              
              <AnimatePresence>
                {!selectedSize && product.sizes.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-primary/60" />
                    Select your size to continue
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Price and Add to Cart */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-6 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-xl border border-border/50">
                {isPurchasable ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Total Price</p>
                    <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      EGP {product.price?.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl font-semibold text-muted-foreground">Pricing Available Soon</p>
                )}
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className={cn(
                    "w-full rounded-2xl h-16 text-base font-semibold relative overflow-hidden transition-all duration-300",
                    selectedSize && isPurchasable && !isAdding
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02]"
                      : ""
                  )}
                  disabled={!selectedSize || isAdding || !isPurchasable}
                  onClick={handleAddToCart}
                >
                  <AnimatePresence mode="wait">
                    {showAdded ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2.5"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                          <Check className="w-6 h-6" />
                        </motion.div>
                        Added to Cart!
                      </motion.span>
                    ) : isAdding ? (
                      <motion.span
                        key="adding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        >
                          <ShoppingBag className="w-5 h-5" />
                        </motion.div>
                        Adding to Cart...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2.5"
                      >
                        <ShoppingBag className="w-5 h-5" />
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

// 