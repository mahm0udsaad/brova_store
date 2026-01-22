"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { triggerHaptic } from "@/lib/haptics"

type AdminProductRow = {
  id: string
  name: string
  price: number | null
  category_id: string | null
  image_url: string | null
  published: boolean | null
  sizes: string[] | null
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]

interface InventoryOnboardingWizardProps {
  products: AdminProductRow[]
  onComplete: () => void
}

export function InventoryOnboardingWizard({ products, onComplete }: InventoryOnboardingWizardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [productData, setProductData] = useState<
    Record<string, { price: string; sizes: string[]; skipped?: boolean }>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  // Filter products that need setup (no price or no sizes)
  const productsNeedingSetup = products.filter((p) => !p.price || !p.sizes || p.sizes.length === 0)

  const currentProduct = productsNeedingSetup[currentIndex]
  const currentData = productData[currentProduct?.id] || { price: "", sizes: [] }

  const isLastProduct = currentIndex === productsNeedingSetup.length - 1
  const canProceed = currentData.price && Number(currentData.price) > 0 && currentData.sizes.length > 0

  const handleOpen = () => {
    if (productsNeedingSetup.length === 0) {
      return
    }
    setIsOpen(true)
    setCurrentIndex(0)
    setProductData({})
  }

  const handleClose = () => {
    triggerHaptic("medium")
    setIsOpen(false)
  }

  const handleNext = () => {
    triggerHaptic("light")
    if (isLastProduct) {
      handleSaveAll()
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    triggerHaptic("light")
    setProductData((prev) => ({
      ...prev,
      [currentProduct.id]: { ...currentData, skipped: true },
    }))
    if (isLastProduct) {
      handleSaveAll()
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePriceChange = (value: string) => {
    setProductData((prev) => ({
      ...prev,
      [currentProduct.id]: { ...currentData, price: value },
    }))
  }

  const handleSizesChange = (sizes: string[]) => {
    setProductData((prev) => ({
      ...prev,
      [currentProduct.id]: { ...currentData, sizes },
    }))
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    triggerHaptic("medium")

    // Save all products that were not skipped
    const updates = Object.entries(productData)
      .filter(([_, data]) => !data.skipped && data.price && data.sizes.length > 0)
      .map(async ([productId, data]) => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: Number(data.price),
            sizes: data.sizes,
            published: true,
          }),
        })
        return response.ok
      })

    await Promise.all(updates)
    setIsSaving(false)
    triggerHaptic("success")
    setIsOpen(false)
    onComplete()
  }

  if (!currentProduct) {
    return null
  }

  return (
    <>
      {/* Trigger Button */}
      {productsNeedingSetup.length > 0 && !isOpen && (
        <Button onClick={handleOpen} className="gap-2" size="lg">
          <span>Setup Inventory</span>
          <span className="px-2 py-0.5 rounded-full bg-primary-foreground text-primary text-xs font-bold">
            {productsNeedingSetup.length}
          </span>
        </Button>
      )}

      {/* Wizard Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/95 backdrop-blur-sm p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl h-full sm:h-auto flex flex-col relative bg-card border-t sm:border sm:rounded-3xl shadow-2xl overflow-hidden"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentIndex + 1) / productsNeedingSetup.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProduct.id}
                    className="p-6 sm:p-8 space-y-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Header */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                        Product {currentIndex + 1} of {productsNeedingSetup.length}
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Setup {currentProduct.name}
                      </h2>
                      <p className="text-muted-foreground">
                        Configure pricing and available sizes for this product
                      </p>
                    </div>

                    {/* Product Preview */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                      <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={currentProduct.image_url || "/placeholder.svg"}
                          alt={currentProduct.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg">{currentProduct.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentProduct.category_id || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Price (EGP)</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter price (e.g., 350)"
                        value={currentData.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="text-lg h-14"
                        autoFocus
                      />
                    </div>

                    {/* Sizes Toggle Group */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Available Sizes</label>
                      <ToggleGroup
                        type="multiple"
                        value={currentData.sizes}
                        onValueChange={handleSizesChange}
                        className="flex-wrap justify-start gap-2"
                      >
                        {AVAILABLE_SIZES.map((size) => (
                          <ToggleGroupItem
                            key={size}
                            value={size}
                            aria-label={`Toggle ${size}`}
                            className="min-w-[60px] h-12 text-base font-semibold border-2 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl"
                          >
                            {size}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      {currentData.sizes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {currentData.sizes.length} size{currentData.sizes.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-6 bg-background/50 backdrop-blur-sm border-t space-y-3">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 text-base font-semibold rounded-xl"
                    onClick={handleSkip}
                    disabled={isSaving}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1 h-12 sm:h-14 text-base font-semibold rounded-xl group"
                    onClick={handleNext}
                    disabled={!canProceed || isSaving}
                  >
                    {isSaving ? (
                      "Saving..."
                    ) : isLastProduct ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Complete Setup
                      </>
                    ) : (
                      <>
                        Next Product
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {productsNeedingSetup.length - currentIndex - 1} product
                  {productsNeedingSetup.length - currentIndex - 1 !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
