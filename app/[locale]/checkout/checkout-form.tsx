"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { useCartContext } from "@/components/storefront/cart/cart-provider"
import { cn } from "@/lib/utils"
import { Loader2, Banknote, ShoppingBag, Truck } from "lucide-react"

interface CheckoutFormProps {
  locale: string
  storeName: string
}

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CheckoutForm({ locale, storeName }: CheckoutFormProps) {
  const router = useRouter()
  const t = useTranslations("storefront")
  const tc = useTranslations("checkoutPage")
  const { cart, isLoaded, subtotal, shippingFee, total, emptyCart, itemCount } =
    useCartContext()

  const isRtl = locale === "ar"

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    fullName.trim().length > 1 &&
    phone.trim().length >= 9 &&
    address.trim().length >= 5 &&
    city.trim().length >= 2 &&
    cart.length > 0

  const handlePlaceOrder = async () => {
    if (!canSubmit || isProcessing) return

    setError(null)
    setIsProcessing(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            size: item.selectedSize !== "_default" ? item.selectedSize : null,
            image: item.product.images?.[0] || item.product.image || null,
          })),
          address: `${address}, ${city}`,
          phone,
          fullName,
          subtotal,
          shippingFee,
          total,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || tc("errors.orderFailed"))
        setIsProcessing(false)
        return
      }

      const { orderId } = await res.json()
      emptyCart()
      router.push(`/${locale}/order-confirmed?id=${orderId}`)
    } catch {
      setError(tc("errors.orderFailed"))
      setIsProcessing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-neutral-300" />
        <p className="text-neutral-500">{t("cart.empty")}</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-sm font-medium text-[var(--theme-primary)] underline underline-offset-4"
        >
          {t("cart.continueShopping")}
        </button>
      </div>
    )
  }

  return (
    <section className="py-8 sm:py-14" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1
          className="text-2xl font-bold mb-8 text-start"
          style={{ fontFamily: "var(--theme-font-heading)" }}
        >
          {tc("title")}
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Form column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery details */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="size-5 text-[var(--theme-primary)]" />
                <h2 className="text-base font-semibold">
                  {tc("deliveryDetails")}
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    {t("checkout.fields.name")} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm transition focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder={isRtl ? "محمد أحمد" : "John Doe"}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    {t("checkout.fields.phone")} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm transition focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder="+966 5XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    {t("checkout.fields.address")} *
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm transition focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none resize-none"
                    placeholder={
                      isRtl
                        ? "شارع الملك فهد، حي العليا"
                        : "123 King Fahd Road, Olaya District"
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    {t("checkout.fields.city")} *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm transition focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder={isRtl ? "الرياض" : "Riyadh"}
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tc("paymentTitle")}</p>
                  <p className="text-xs text-neutral-500">
                    {tc("paymentSubtitle")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary column */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 lg:sticky lg:top-24">
              <h2 className="text-base font-semibold">{tc("orderSummary")}</h2>

              {/* Items */}
              <ul className="space-y-3 max-h-56 overflow-y-auto">
                {cart.map((item) => {
                  const img =
                    item.product.images?.[0] || item.product.image || ""
                  return (
                    <li
                      key={`${item.product.id}-${item.selectedSize}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                        {img ? (
                          <Image
                            src={img}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="size-4 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate text-start">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          x{item.quantity}
                          {item.selectedSize !== "_default" &&
                            ` / ${item.selectedSize}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" dir="ltr">
                        {formatCurrency(
                          locale,
                          (item.product.price ?? 0) * item.quantity
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="h-px bg-neutral-100" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tc("subtotal")}</span>
                  <span className="font-medium" dir="ltr">
                    {formatCurrency(locale, subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tc("shipping")}</span>
                  <span className="font-medium" dir="ltr">
                    {formatCurrency(locale, shippingFee)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-neutral-100" />

              <div className="flex justify-between font-bold">
                <span>{tc("total")}</span>
                <span dir="ltr">{formatCurrency(locale, total)}</span>
              </div>

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!canSubmit || isProcessing}
                className={cn(
                  "mt-2 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition-all",
                  "bg-[var(--theme-primary)] hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {tc("processing")}
                  </span>
                ) : (
                  tc("placeOrder", { total: formatCurrency(locale, total) })
                )}
              </button>

              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              {!canSubmit && !isProcessing && cart.length > 0 && (
                <p className="text-xs text-neutral-400 text-center">
                  {tc("errors.requiredFields")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
