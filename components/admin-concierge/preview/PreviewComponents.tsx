"use client"

import { useLocale } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import type { DraftProduct, DraftBanner, DraftPageSection } from "@/lib/ai/concierge-context"

// =============================================================================
// Preview versions of storefront components for the onboarding live preview.
// These are client components that mirror the server storefront components
// but accept data as props and use scaled-down styling.
// =============================================================================

// ---------------------------------------------------------------------------
// Store Header
// ---------------------------------------------------------------------------
export function PreviewStoreHeader({
  storeName,
  accentColor,
  logoUrl,
}: {
  storeName?: string
  accentColor?: string
  logoUrl?: string
}) {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      dir={isAr ? "rtl" : "ltr"}
      style={{ borderColor: "var(--preview-border)" }}
    >
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-7 h-7 rounded-md object-contain"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: accentColor || "#111827" }}
          >
            {storeName?.charAt(0)?.toUpperCase() || "B"}
          </div>
        )}
        <span className="text-sm font-semibold truncate max-w-[140px]" style={{ color: "var(--preview-foreground)" }}>
          {storeName || (isAr ? "متجرك" : "Your Store")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border" style={{ borderColor: "var(--preview-muted)" }} />
        <div className="w-4 h-4 rounded-full border" style={{ borderColor: "var(--preview-muted)" }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hero Banner
// ---------------------------------------------------------------------------
export function PreviewHeroBanner({
  banner,
  primaryColor,
  accentColor,
}: {
  banner?: DraftBanner
  primaryColor?: string
  accentColor?: string
}) {
  const locale = useLocale()
  const isAr = locale === "ar"

  const title = isAr
    ? (banner?.title_ar || "اكتشف منتجاتنا")
    : (banner?.title || "Discover Our Products")
  const subtitle = isAr
    ? (banner?.subtitle_ar || "أفضل المنتجات بأفضل الأسعار")
    : (banner?.subtitle || "Best products at the best prices")

  return (
    <div
      className="relative px-4 py-8 text-center overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: banner?.image_url
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${banner.image_url}) center/cover`
          : `linear-gradient(135deg, ${primaryColor || "#111827"} 0%, ${accentColor || "#374151"} 100%)`,
        color: "#fff",
      }}
    >
      <h2 className="text-lg font-bold leading-tight">{title}</h2>
      <p className="mt-1 text-xs opacity-80">{subtitle}</p>
      <div
        className="mt-3 inline-block rounded-full px-4 py-1.5 text-[10px] font-semibold"
        style={{ backgroundColor: accentColor || "#fff", color: primaryColor || "#111" }}
      >
        {isAr ? "تسوق الآن" : "Shop Now"}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product Grid
// ---------------------------------------------------------------------------
export function PreviewProductGrid({ products }: { products: DraftProduct[] }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  if (products.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="text-xs font-medium mb-3" style={{ color: "var(--preview-foreground)" }}>
          {isAr ? "المنتجات" : "Products"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: "var(--preview-border)" }}
            >
              <span className="text-[10px]" style={{ color: "var(--preview-muted)" }}>
                {isAr ? "منتج" : "Product"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="text-xs font-medium mb-3" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "المنتجات" : "Products"}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {products.slice(0, 4).map((product) => (
            <PreviewProductCard key={product.id} product={product} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product Carousel (horizontal scroll variant)
// ---------------------------------------------------------------------------
export function PreviewProductCarousel({ products }: { products: DraftProduct[] }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div className="py-3" dir={isAr ? "rtl" : "ltr"}>
      <div className="px-4 text-xs font-medium mb-2" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "مختارات" : "Featured"}
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {products.length === 0
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-28 shrink-0 aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: "var(--preview-border)" }}
              >
                <span className="text-[9px]" style={{ color: "var(--preview-muted)" }}>
                  {isAr ? "منتج" : "Item"}
                </span>
              </div>
            ))
          : products.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="w-28 shrink-0 rounded-lg overflow-hidden border"
                style={{ borderColor: "var(--preview-border)" }}
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{
                    backgroundColor: "var(--preview-muted-bg)",
                    backgroundImage: product.image_url ? `url(${product.image_url})` : undefined,
                  }}
                />
                <div className="p-1.5">
                  <p className="text-[9px] font-medium truncate" style={{ color: "var(--preview-foreground)" }}>
                    {isAr ? (product.name_ar || product.name) : product.name}
                  </p>
                  {product.price != null && (
                    <p className="text-[9px] font-bold" style={{ color: "var(--preview-accent)" }}>
                      {isAr ? `${product.price} ر.س` : `SAR ${product.price}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------
function PreviewProductCard({ product }: { product: DraftProduct }) {
  const locale = useLocale()
  const isAr = locale === "ar"
  const name = isAr ? (product.name_ar || product.name) : product.name

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: "var(--preview-border)", backgroundColor: "var(--preview-background)" }}
    >
      <div
        className="aspect-square bg-cover bg-center"
        style={{
          backgroundColor: "var(--preview-muted-bg)",
          backgroundImage: product.image_url ? `url(${product.image_url})` : undefined,
        }}
      >
        {!product.image_url && (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[10px] font-medium truncate" style={{ color: "var(--preview-foreground)" }}>
          {name}
        </p>
        {product.price != null && (
          <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--preview-accent)" }}>
            {isAr ? `${product.price} ر.س` : `SAR ${product.price}`}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Trust Badges
// ---------------------------------------------------------------------------
export function PreviewTrustBadges({ config }: { config: Record<string, unknown> }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  const badges = (config.badges as Array<{ type: string }>) || [
    { type: "mada" },
    { type: "visa" },
    { type: "apple_pay" },
    { type: "tamara" },
  ]

  const badgeLabels: Record<string, string> = {
    mada: "mada",
    visa: "Visa",
    mastercard: "MC",
    apple_pay: "Apple Pay",
    tamara: isAr ? "تمارا" : "Tamara",
    tabby: isAr ? "تابي" : "tabby",
    cod: isAr ? "دفع عند الاستلام" : "COD",
    stc_pay: "STC Pay",
  }

  return (
    <div className="px-4 py-3 border-y" style={{ borderColor: "var(--preview-border)" }}>
      <p className="text-[9px] text-center font-medium uppercase tracking-wider mb-2" style={{ color: "var(--preview-muted)" }}>
        {isAr ? "طرق الدفع" : "Payment Methods"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {badges.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-1 rounded border px-1.5 py-0.5"
            style={{ borderColor: "var(--preview-border)", backgroundColor: "var(--preview-background)" }}
          >
            <span className="text-[8px] font-medium" style={{ color: "var(--preview-foreground)" }}>
              {badgeLabels[badge.type] || badge.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delivery Info
// ---------------------------------------------------------------------------
export function PreviewDeliveryInfo({ config }: { config: Record<string, unknown> }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  const defaultZones = [
    { city: "Riyadh", city_ar: "الرياض", time: isAr ? "نفس اليوم" : "Same day", cost: 0 },
    { city: "Jeddah", city_ar: "جدة", time: isAr ? "١-٢ يوم" : "1-2 days", cost: 25 },
  ]

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-medium mb-2" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "التوصيل" : "Delivery"}
      </p>
      {config.free_shipping_threshold != null && (
        <div className="mb-2 rounded bg-green-50 px-2 py-1 text-center">
          <span className="text-[8px] text-green-700">
            {isAr
              ? `شحن مجاني فوق ${String(config.free_shipping_threshold)} ر.س`
              : `Free shipping over SAR ${String(config.free_shipping_threshold)}`}
          </span>
        </div>
      )}
      <div className="space-y-1">
        {defaultZones.map((zone, i) => (
          <div key={i} className="flex justify-between text-[9px]" dir={isAr ? "rtl" : "ltr"}>
            <span style={{ color: "var(--preview-foreground)" }}>{isAr ? zone.city_ar : zone.city}</span>
            <span style={{ color: "var(--preview-muted)" }}>{zone.time}</span>
            <span style={{ color: "var(--preview-foreground)" }}>
              {zone.cost === 0 ? (isAr ? "مجاني" : "Free") : `${zone.cost} ${isAr ? "ر.س" : "SAR"}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WhatsApp Button (floating)
// ---------------------------------------------------------------------------
export function PreviewWhatsAppButton() {
  return (
    <div className="absolute bottom-3 right-3 z-10">
      <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Occasion Banner
// ---------------------------------------------------------------------------
export function PreviewOccasionBanner({ config }: { config: Record<string, unknown> }) {
  const locale = useLocale()
  const isAr = locale === "ar"
  const occasion = (config.occasion as string) || "custom"

  const occasionDefaults: Record<string, { bg: string; titleAr: string; titleEn: string }> = {
    ramadan: { bg: "linear-gradient(135deg, #1a472a, #40916c)", titleAr: "رمضان كريم", titleEn: "Ramadan Kareem" },
    eid_fitr: { bg: "linear-gradient(135deg, #7c3aed, #a78bfa)", titleAr: "عيد مبارك", titleEn: "Eid Mubarak" },
    eid_adha: { bg: "linear-gradient(135deg, #b45309, #d97706)", titleAr: "عيد أضحى مبارك", titleEn: "Eid Al-Adha Mubarak" },
    national_day: { bg: "linear-gradient(135deg, #15803d, #22c55e)", titleAr: "اليوم الوطني", titleEn: "National Day" },
    white_friday: { bg: "linear-gradient(135deg, #000, #1f2937)", titleAr: "الجمعة البيضاء", titleEn: "White Friday" },
    back_to_school: { bg: "linear-gradient(135deg, #1d4ed8, #3b82f6)", titleAr: "العودة للمدارس", titleEn: "Back to School" },
    custom: { bg: "linear-gradient(135deg, #111827, #374151)", titleAr: "عرض خاص", titleEn: "Special Offer" },
  }

  const defaults = occasionDefaults[occasion] || occasionDefaults.custom
  const title = isAr
    ? ((config.title_ar as string) || defaults.titleAr)
    : ((config.title as string) || defaults.titleEn)

  return (
    <div
      className="px-4 py-4 text-center text-white"
      style={{ background: (config.background_color as string) || defaults.bg }}
    >
      <p className="text-xs font-bold">{title}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
export function PreviewFooter({ storeName }: { storeName?: string }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div
      className="px-4 py-4 border-t text-center"
      style={{ borderColor: "var(--preview-border)", backgroundColor: "var(--preview-muted-bg)" }}
    >
      <p className="text-[9px]" style={{ color: "var(--preview-muted)" }}>
        &copy; 2026 {storeName || (isAr ? "متجرك" : "Your Store")}
      </p>
      <p className="text-[8px] mt-1" style={{ color: "var(--preview-muted)" }}>
        {isAr ? "مدعوم بواسطة بروفا" : "Powered by Brova"}
      </p>
    </div>
  )
}
