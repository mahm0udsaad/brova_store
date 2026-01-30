"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ShoppingBag, Heart } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/hooks/use-cart"
import { triggerHaptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { blurPlaceholders } from "@/lib/image-utils"
import type { Product } from "@/types"
import { useLocale, useTranslations } from "next-intl"

interface AssistantProductCardProps {
  product: Product
}

export function AssistantProductCard({ product }: AssistantProductCardProps) {
  const locale = useLocale()
  const t = useTranslations("assistantProduct")
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const hasPrice = typeof product.price === "number" && product.price > 0
  const primarySize = product.sizes?.[0]
  const canAdd = Boolean(hasPrice && primarySize)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(value)

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canAdd || isAdding) return

    setIsAdding(true)
    triggerHaptic("medium")
    addToCart(product, primarySize)
    toast.success(t("addedToCart"))
    setTimeout(() => setIsAdding(false), 500)
  }

  const handleFavorite = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsFavorited(!isFavorited)
    triggerHaptic("light")
  }

  return (
    <Link
      href={`/${locale}/product/${product.id}`}
      className="group block shrink-0 w-[200px] snap-start"
    >
      {/* Image Container - Takes most of the card */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="200px"
          quality={90}
          placeholder="blur"
          blurDataURL={blurPlaceholders.product}
        />
        
        {/* Favorite Button - Top Right */}
        <button
          onClick={handleFavorite}
          className="absolute ltr:right-2 rtl:left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-md transition-all hover:bg-black/40"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all",
              isFavorited ? "fill-red-500 text-red-500" : "text-white"
            )}
          />
        </button>

        {/* Gradient Overlay at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Product Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="mb-1 text-sm font-semibold line-clamp-2 drop-shadow-lg">
            {product.name}
          </p>
          {hasPrice ? (
            <p className="text-lg font-bold drop-shadow-lg">
              {formatCurrency(product.price!)}
            </p>
          ) : (
            <p className="text-xs opacity-80">{t("pricingSoon")}</p>
          )}
        </div>
      </div>

      {/* Add to Cart Button - Below Image */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd}
        className={cn(
          "mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
          canAdd
            ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        <ShoppingBag className="h-4 w-4" />
        {isAdding ? t("added") : t("addToCart")}
      </button>
    </Link>
  )
}
