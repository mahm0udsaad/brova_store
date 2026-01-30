"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Check } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ProductCard } from "@/components/product-card"
import { getOrder } from "@/lib/store"
import { triggerHaptic } from "@/lib/haptics"
import type { Order, Product } from "@/types"
import { useLocale, useTranslations } from "next-intl"

interface ConfirmationPageClientProps {
  products: Product[]
}

export default function ConfirmationPageClient({ products }: ConfirmationPageClientProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("confirmationPage")
  const isRtl = locale === "ar"
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const savedOrder = getOrder()
    if (!savedOrder) {
      router.push(`/${locale}`)
      return
    }
    setOrder(savedOrder)
    triggerHaptic("success")
  }, [router])

  const orderedIds = order?.items.map((item) => item.product.id) || []
  const recommendedProducts = products.filter((p) => !orderedIds.includes(p.id)).slice(0, 2)

  if (!order) return null

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative">
        {/* Hero Image Section */}
        <div className="relative mx-4 mt-4 lg:mx-auto lg:max-w-2xl">
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href={`/${locale}`}
              className="w-12 h-12 rounded-2xl bg-black/80 backdrop-blur-sm flex items-center justify-center"
            >
              {isRtl ? <ChevronLeft className="w-6 h-6 text-white rotate-180" /> : <ChevronLeft className="w-6 h-6 text-white" />}
            </Link>
          </div>

          {/* Desert Dunes Background with Badge */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
            <img
              src="/dark-desert-sand-dunes-at-night-moody-atmospheric-.jpg"
              alt={t("heroAlt")}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scalloped/Flower shape SVG */}
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-2xl">
                  {/* Scalloped badge shape */}
                  <path
                    d="M60 10
                       Q70 10 75 20
                       Q85 15 90 25
                       Q100 25 100 35
                       Q110 40 105 50
                       Q115 55 110 65
                       Q115 75 105 80
                       Q110 90 100 90
                       Q100 100 90 100
                       Q85 110 75 105
                       Q70 115 60 110
                       Q50 115 45 105
                       Q35 110 30 100
                       Q20 100 20 90
                       Q10 90 15 80
                       Q5 75 10 65
                       Q5 55 15 50
                       Q10 40 20 35
                       Q20 25 30 25
                       Q35 15 45 20
                       Q50 10 60 10Z"
                    fill="#E8E4DF"
                    stroke="none"
                  />
                </svg>
                {/* Checkmark */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-12 h-12 text-zinc-800" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-md mx-auto px-4 mt-8 lg:max-w-2xl">
          {/* Success Message */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4 leading-tight"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
              <br />
              {t("titleLine3")}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t("subtitleLine1")}
              <br />
              {t("subtitleLine2")}
            </p>
          </div>

          {/* Recommendations */}
          {recommendedProducts.length > 0 && (
            <div>
              <h2 className="font-bold uppercase tracking-widest text-sm mb-6 text-muted-foreground">
                {t("recommendationsTitle")}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
