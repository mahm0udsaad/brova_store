"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { CollapsibleAddressForm } from "@/components/collapsible-address-form"
import { PhoneAuthModal } from "@/components/phone-auth-modal"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { saveOrder, saveUserProfile, getUserProfile } from "@/lib/store"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"
import { Check, Loader2, Package, ShieldCheck, Banknote } from "lucide-react"
import type { Order } from "@/types"

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, subtotal, shippingFee, total, emptyCart, itemCount, isLoaded } = useCart()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [address, setAddress] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [forceExpandAddress, setForceExpandAddress] = useState(false)

  useEffect(() => {
    const savedProfile = getUserProfile()
    if (savedProfile) {
      setFullName(savedProfile.fullName)
      setPhoneNumber(savedProfile.phoneNumber.replace("+20", ""))
      setAddress(savedProfile.address)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated && cart.length > 0) setShowAuthModal(true)
  }, [authLoading, isAuthenticated, cart.length])

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone.replace("+20", ""))
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) return
    const savedProfile = getUserProfile()
    if (savedProfile?.fullName) setFullName(savedProfile.fullName)
  }, [isAuthenticated])

  const isPhoneValid =
    isAuthenticated || (phoneNumber ? /^(\+20|0)?1[0125]\d{8}$/.test(phoneNumber.replace(/\s/g, "")) : false)

  const isAddressValid = address.trim().length >= 20

  const canPlaceOrder =
    fullName.trim().length > 0 && isPhoneValid && isAddressValid && isAuthenticated && cart.length > 0

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    const nextAddressError = !isAddressValid ? "Please enter your full delivery address" : null
    setAddressError(nextAddressError)
    setForceExpandAddress(!!nextAddressError)

    if (!canPlaceOrder) return

    setIsProcessing(true)
    triggerHaptic("medium")

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const formattedPhone = phoneNumber.startsWith("+20")
      ? phoneNumber
      : phoneNumber.startsWith("0")
        ? `+2${phoneNumber}`
        : `+20${phoneNumber}`

    const order: Order = {
      items: cart,
      address: {
        buildingNumber: "",
        apartmentFloor: "",
        street: address,
        district: "",
        landmark: "",
        city: address.toLowerCase().includes("giza") ? "Giza" : "Cairo",
        country: "Egypt",
      },
      contactInfo: {
        fullName,
        phoneNumber: formattedPhone,
      },
      subtotal,
      shippingFee,
      total,
      createdAt: new Date().toISOString(),
    }

    saveOrder(order)

    saveUserProfile({
      fullName,
      phoneNumber: formattedPhone,
      address,
    })

    emptyCart()

    setShowSuccess(true)
    triggerHaptic("success")
    playSuccessSound()

    setTimeout(() => {
      router.push("/confirmation")
    }, 1200)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    triggerHaptic("success")
    const savedProfile = getUserProfile()
    if (savedProfile?.fullName) setFullName(savedProfile.fullName)
  }

  useEffect(() => {
    if (isLoaded && cart.length === 0 && !showSuccess) {
      router.push("/cart")
    }
  }, [isLoaded, cart.length, router, showSuccess])

  if (!isLoaded || authLoading) {
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

  if (cart.length === 0 && !showSuccess) {
    return null
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
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        required={!isAuthenticated}
      />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 lg:max-w-6xl lg:grid lg:grid-cols-2 lg:gap-12">
        <div>
          <Header showBack title="Checkout" />

          {!isAuthenticated && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowAuthModal(true)}
              className="w-full mb-4 p-3 bg-primary/10 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Sign in for faster checkout</span>
              </div>
              <span className="text-xs text-primary">Sign In</span>
            </motion.button>
          )}

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold mb-4">Delivery Details</h2>
            <CollapsibleAddressForm
              address={address}
              showContactFields={false}
              onAddressChange={(next) => {
                setAddress(next)
                if (next.trim().length >= 20) {
                  setAddressError(null)
                  setForceExpandAddress(false)
                }
              }}
              addressError={addressError}
              forceManualExpanded={forceExpandAddress}
            />
          </motion.div>

          <motion.div
            className="bg-muted rounded-2xl p-4 mb-6 lg:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Pay when you receive your order. Delivery in 1-3 working days.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <motion.div
            className="bg-muted rounded-2xl p-4 mb-6 lg:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </h2>
            <div className="space-y-3 text-sm max-h-48 overflow-y-auto scrollbar-hide">
              {cart.map((item, index) => (
                <motion.div
                  key={`${item.product.id}-${item.selectedSize}`}
                  className="flex justify-between items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card overflow-hidden">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {item.selectedSize} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">EGP {(item.product.price * item.quantity).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>

            <div className="h-px bg-border my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>EGP {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>EGP {shippingFee.toLocaleString()}</span>
              </div>
            </div>

            <div className="h-px bg-border my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>EGP {total.toLocaleString()}</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              size="lg"
              className="w-full rounded-2xl h-16 text-base font-semibold transition-all duration-300 active:scale-[0.98]"
              disabled={cart.length === 0 || isProcessing}
              onClick={handlePlaceOrder}
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.span
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </motion.span>
                ) : (
                  <motion.span key="place" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Place Order - EGP {total.toLocaleString()}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {!canPlaceOrder && !isProcessing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground text-center mt-3"
              >
                {!isAuthenticated
                  ? "Please sign in to continue checkout"
                  : !isAddressValid
                    ? "Please enter your full delivery address"
                    : "Please fill in all required fields"}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      <BottomNav cartCount={itemCount} />
    </motion.div>
  )
}
