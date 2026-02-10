"use client"

import Image from "next/image"
import type { ProductCardData } from "@/types/ai"

interface ProductGridProps {
  products: ProductCardData[]
  locale: "ar" | "en"
}

export function ProductGrid({ products, locale }: ProductGridProps) {
  const isRTL = locale === "ar"

  if (!products || products.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isRTL ? "لم يتم العثور على منتجات" : "No products found"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir={isRTL ? "rtl" : "ltr"}>
      {products.map((product) => (
        <div
          key={product.id}
          className="group rounded-xl border border-border/50 bg-card overflow-hidden transition-shadow hover:shadow-md"
        >
          <div className="aspect-square relative bg-muted/20 overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={isRTL ? product.nameAr || product.name : product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                {isRTL ? "بدون صورة" : "No image"}
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-medium px-2 py-1 bg-black/60 rounded">
                  {isRTL ? "نفذ المخزون" : "Out of Stock"}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 space-y-1.5">
            <h3 className="text-sm font-medium truncate">
              {isRTL ? product.nameAr || product.name : product.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">
                {product.price} {product.currency}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
            {product.category && (
              <p className="text-xs text-muted-foreground truncate">{product.category}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
