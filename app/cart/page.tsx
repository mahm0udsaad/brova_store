"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { CartItem } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { triggerHaptic } from "@/lib/haptics"
import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function CartPage() {
  const { cart, updateQuantity, subtotal, shippingFee, total, itemCount, isLoaded } = useCart()

  const handleCheckoutClick = () => {
    triggerHaptic("medium")
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin"
        />
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-background pb-24"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="max-w-md mx-auto px-4 md:max-w-2xl lg:max-w-4xl">
        <Header showBack title="Cart" />

        {cart.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button asChild className="rounded-xl h-12 px-8">
                <Link href="/">Start Shopping</Link>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-3">
              <AnimatePresence>
                {cart.map((item, index) => (
                  <CartItem
                    key={`${item.product.id}-${item.selectedSize}`}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <motion.div
              className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-muted rounded-2xl p-5 mt-6 lg:mt-0">
                <h2 className="font-bold text-lg mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                    <span className="font-semibold">EGP {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping Fee</span>
                    <span className="font-semibold">EGP {shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <motion.span
                      key={total}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="font-bold text-xl"
                    >
                      EGP {total.toLocaleString()}
                    </motion.span>
                  </div>
                </div>

                <motion.div className="mt-6" whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-2xl h-14 text-base font-semibold group"
                    onClick={handleCheckoutClick}
                  >
                    <Link href="/checkout" className="flex items-center justify-center gap-2">
                      Continue to Checkout
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              {/* Delivery notice */}
              <motion.p
                className="text-xs text-muted-foreground text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Delivery available in Cairo & Giza only
              </motion.p>
            </motion.div>
          </div>
        )}
      </div>

      <BottomNav cartCount={itemCount} />
    </motion.div>
  )
}
