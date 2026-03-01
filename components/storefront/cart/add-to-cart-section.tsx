"use client"

import { useState, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useCartContext } from "./cart-provider"
import { cn } from "@/lib/utils"
import { Minus, Plus, Check } from "lucide-react"
import type { StorefrontProductInfo } from "@/types"
import { toCartProduct } from "@/types"

interface AddToCartSectionProps {
  product: StorefrontProductInfo
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const locale = useLocale()
  const t = useTranslations("storefront")
  const { addToCart, openCart } = useCartContext()

  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes?.[0] ?? "_default"
  )
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0] ?? ""
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const isRtl = locale === "ar"

  const handleAddToCart = useCallback(() => {
    const cartProduct = toCartProduct(product)
    addToCart(cartProduct, selectedSize, quantity)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      openCart()
    }, 600)
  }, [product, selectedSize, quantity, addToCart, openCart])

  return (
    <div className="flex flex-col gap-5" dir={isRtl ? "rtl" : "ltr"}>
      {/* Size selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-medium text-[var(--theme-foreground)]">
            {t("productDetail.size")}
          </span>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "flex h-10 min-w-[2.75rem] items-center justify-center rounded-full px-4 text-sm font-medium transition-all",
                  selectedSize === size
                    ? "bg-[var(--theme-foreground)] text-[var(--theme-background)]"
                    : "bg-neutral-100 text-[var(--theme-foreground)] hover:bg-neutral-200"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color selector */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-medium text-[var(--theme-foreground)]">
            {t("productDetail.color")}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all",
                  selectedColor === color
                    ? "ring-2 ring-[var(--theme-foreground)] ring-offset-2"
                    : "hover:ring-2 hover:ring-neutral-300 hover:ring-offset-1"
                )}
              >
                <span
                  className="h-7 w-7 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity picker */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-[var(--theme-foreground)]">
          {t("productDetail.quantity")}
        </span>
        <div className="inline-flex items-center rounded-full bg-neutral-100">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--theme-foreground)] transition hover:bg-neutral-200"
            aria-label={t("cart.decrease")}
          >
            <Minus className="size-4" />
          </button>
          <span className="flex h-10 w-12 items-center justify-center text-sm font-semibold text-[var(--theme-foreground)] tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--theme-foreground)] transition hover:bg-neutral-200"
            aria-label={t("cart.increase")}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAddToCart}
        disabled={added}
        className={cn(
          "h-14 w-full rounded-full text-base font-semibold transition-all",
          "bg-[var(--theme-primary)] text-white",
          "hover:opacity-90 hover:shadow-lg",
          "disabled:opacity-70",
          added && "bg-green-600"
        )}
      >
        {added ? (
          <span className="inline-flex items-center gap-2">
            <Check className="size-5" />
            {locale === "ar" ? "تمت الإضافة" : "Added!"}
          </span>
        ) : (
          t("productDetail.addToCart")
        )}
      </button>
    </div>
  )
}
