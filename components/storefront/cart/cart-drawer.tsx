"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { useCartContext } from "./cart-provider"
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CartDrawer() {
  const locale = useLocale()
  const t = useTranslations("storefront")
  const {
    cart,
    isLoaded,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    total,
    itemCount,
  } = useCartContext()
  const drawerRef = useRef<HTMLDivElement>(null)
  const isRtl = locale === "ar"

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart()
    }
    if (isCartOpen) {
      document.addEventListener("keydown", handleKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [isCartOpen, closeCart])

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label={t("cart.title")}
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "fixed top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300",
          isRtl ? "left-0" : "right-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {t("cart.title")} {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!isLoaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <ShoppingBag className="h-7 w-7 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500">{t("cart.empty")}</p>
              <button
                onClick={closeCart}
                className="text-sm font-medium text-[var(--theme-primary,#111827)] underline underline-offset-4 transition hover:opacity-80"
              >
                {t("cart.continueShopping")}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 px-5">
              {cart.map((item) => {
                const image =
                  item.product.images?.[0] || item.product.image || ""
                const sizeLabel =
                  item.selectedSize !== "_default"
                    ? item.selectedSize
                    : null

                return (
                  <li
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex gap-4 py-4"
                  >
                    {/* Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-300">
                          <ShoppingBag className="size-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 text-start">
                          {item.product.name}
                        </h3>
                        {sizeLabel && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {t("productDetail.size")}: {sizeLabel}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="inline-flex items-center rounded-full border border-neutral-200">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.quantity - 1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
                            aria-label={t("cart.decrease")}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.quantity + 1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
                            aria-label={t("cart.increase")}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Price + remove */}
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-semibold text-neutral-900"
                            dir="ltr"
                          >
                            {formatCurrency(
                              locale,
                              (item.product.price ?? 0) * item.quantity
                            )}
                          </span>
                          <button
                            onClick={() =>
                              removeFromCart(
                                item.product.id,
                                item.selectedSize
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label={t("cart.remove")}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">{t("cart.subtotal")}</span>
              <span className="font-semibold text-neutral-900" dir="ltr">
                {formatCurrency(locale, subtotal)}
              </span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              onClick={closeCart}
              className={cn(
                "flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition-all",
                "bg-[var(--theme-primary,#111827)] hover:opacity-90"
              )}
            >
              {t("cart.checkout")} &middot;{" "}
              <span dir="ltr" className="ms-1">
                {formatCurrency(locale, total)}
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
