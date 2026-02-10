"use client"

import { CheckCircle2 } from "lucide-react"
import type { CartConfirmationData } from "@/types/ai"

interface CartConfirmationProps {
  data: CartConfirmationData
  locale: "ar" | "en"
}

export function CartConfirmation({ data, locale }: CartConfirmationProps) {
  const isRTL = locale === "ar"

  return (
    <div
      className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          {isRTL ? data.messageAr : data.message}
        </p>
      </div>

      <div className="flex items-center gap-3 ps-7">
        {data.addedProduct.image && (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={data.addedProduct.image}
              alt={isRTL ? data.addedProduct.nameAr || data.addedProduct.name : data.addedProduct.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {isRTL ? data.addedProduct.nameAr || data.addedProduct.name : data.addedProduct.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.addedProduct.price} {data.addedProduct.currency}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between ps-7 pt-1 border-t border-green-500/20">
        <span className="text-xs text-muted-foreground">
          {isRTL
            ? `${data.cartItemCount} عنصر في السلة`
            : `${data.cartItemCount} item${data.cartItemCount !== 1 ? "s" : ""} in cart`}
        </span>
        <span className="text-sm font-semibold">
          {data.cartTotal} {data.addedProduct.currency}
        </span>
      </div>
    </div>
  )
}
