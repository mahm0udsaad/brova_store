"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConcierge } from "../ConciergeProvider"
import {
  PreviewStoreHeader,
  PreviewHeroBanner,
  PreviewProductGrid,
  PreviewProductCarousel,
  PreviewCategoryBrowser,
  PreviewTrustBadges,
  PreviewDeliveryInfo,
  PreviewWhatsAppButton,
  PreviewOccasionBanner,
  PreviewFooter,
} from "./PreviewComponents"

// =============================================================================
// LiveStorePreview
//
// Renders a scaled-down live preview of the store in the right panel of the
// onboarding flow. Maps draftState.page_sections to preview components and
// shows real-time updates as the AI configures the store.
// =============================================================================

const SECTION_COMPONENT_MAP: Record<string, string> = {
  StoreHeader: "header",
  HeroBanner: "hero",
  ProductGrid: "products",
  ProductCarousel: "products",
  FeaturedCollections: "collections",
  Testimonials: "testimonials",
  NewsletterSignup: "newsletter",
  StoreInfo: "info",
  StoreFooter: "footer",
  WhatsAppButton: "whatsapp",
  TrustBadges: "trust",
  DeliveryInfo: "delivery",
  OccasionBanner: "occasion",
  CategoryBrowser: "categories",
  ShippingCalculator: "shipping",
  AIShoppingAssistant: "ai_chat",
}

export function LiveStorePreview() {
  const locale = useLocale()
  const isAr = locale === "ar"
  const { draftState } = useConcierge()
  const scrollRef = useRef<HTMLDivElement | undefined>(undefined)
  const contentRef = useRef<HTMLDivElement | undefined>(undefined)
  const [scrollHeight, setScrollHeight] = useState(0)

  const storeName = draftState.store_name?.value
  const primaryColor = draftState.appearance?.primary_color
  const accentColor = draftState.appearance?.accent_color
  const logoUrl = draftState.appearance?.logo_preview_url
  const products = draftState.products
  const sections = draftState.page_sections || []
  const banners = draftState.banners || []
  const heroBanner = banners.find((b) => b.position === "hero") || banners[0]

  // Track which MENA components exist
  const sectionTypes = useMemo(
    () => new Set(sections.map((s) => s.type)),
    [sections]
  )

  const hasWhatsApp = sectionTypes.has("WhatsAppButton")
  const hasTrustBadges = sectionTypes.has("TrustBadges")
  const hasDeliveryInfo = sectionTypes.has("DeliveryInfo")

  // Find occasion banner configs
  const occasionSections = sections.filter((s) => s.type === "OccasionBanner")

  // CSS variables for theme
  const themeVars = useMemo(
    () =>
      ({
        "--preview-primary": primaryColor || "#111827",
        "--preview-accent": accentColor || "#10B981",
        "--preview-background": "#ffffff",
        "--preview-foreground": "#0f172a",
        "--preview-muted": "#6b7280",
        "--preview-muted-bg": "#f3f4f6",
        "--preview-border": "#e5e7eb",
      }) as React.CSSProperties,
    [primaryColor, accentColor]
  )

  // Adjust scroll container height after CSS scale
  useEffect(() => {
    if (!contentRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScrollHeight(entry.contentRect.height * 0.49)
      }
    })
    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [])

  const hasSections = sections.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {isAr ? "معاينة" : "Preview"}
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
          {isAr ? "مسودة" : "Draft"}
        </span>
      </div>

      {/* Scrollable preview area */}
      <div
        ref={scrollRef as any}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ height: scrollHeight > 0 ? scrollHeight : undefined }}
      >
        <div className="flex justify-center py-4 px-2">
          {/* Phone frame */}
          <div
            className="w-full max-w-[380px] rounded-2xl border border-border shadow-sm overflow-hidden"
            style={{
              ...themeVars,
              backgroundColor: "var(--preview-background)",
              transition: "all 0.5s ease",
            }}
          >
            <div ref={contentRef as any} className="relative">
              <AnimatePresence mode="wait">
                {hasSections ? (
                  <motion.div
                    key="sections"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Render sections in order */}
                    {sections.map((section) => (
                      <SectionRenderer
                        key={section.id}
                        section={section}
                        storeName={storeName}
                        primaryColor={primaryColor}
                        accentColor={accentColor}
                        logoUrl={logoUrl}
                        products={products}
                        heroBanner={heroBanner}
                      />
                    ))}

                    {/* WhatsApp floating button if present */}
                    {hasWhatsApp && <PreviewWhatsAppButton />}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-[400px]"
                  >
                    {/* Basic preview even without sections */}
                    <PreviewStoreHeader
                      storeName={storeName}
                      accentColor={accentColor}
                      logoUrl={logoUrl}
                    />
                    <PreviewHeroBanner
                      banner={heroBanner}
                      primaryColor={primaryColor}
                      accentColor={accentColor}
                    />
                    <PreviewProductGrid products={products} />
                    <PreviewFooter storeName={storeName} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Section Renderer — maps section type to preview component
// =============================================================================

function SectionRenderer({
  section,
  storeName,
  primaryColor,
  accentColor,
  logoUrl,
  products,
  heroBanner,
}: {
  section: { id: string; type: string; config: Record<string, unknown>; position: number }
  storeName?: string
  primaryColor?: string
  accentColor?: string
  logoUrl?: string
  products: any[]
  heroBanner?: any
}) {
  const componentType = section.type

  switch (componentType) {
    case "StoreHeader":
      return (
        <PreviewStoreHeader
          storeName={storeName}
          accentColor={accentColor}
          logoUrl={logoUrl}
        />
      )
    case "HeroBanner":
      return (
        <PreviewHeroBanner
          banner={heroBanner}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      )
    case "ProductGrid":
      return <PreviewProductGrid products={products} />
    case "ProductCarousel":
      return <PreviewProductCarousel products={products} />
    case "TrustBadges":
      return <PreviewTrustBadges config={section.config} />
    case "DeliveryInfo":
      return <PreviewDeliveryInfo config={section.config} />
    case "OccasionBanner":
      return <PreviewOccasionBanner config={section.config} />
    case "StoreFooter":
      return <PreviewFooter storeName={storeName} />
    case "CategoryBrowser":
      return <PreviewCategoryBrowser config={section.config} />
    case "WhatsAppButton":
      // Rendered as floating button outside the section list
      return null
    case "FeaturedCollections":
      return <PreviewFeaturedCollections />
    case "Testimonials":
      return <PreviewTestimonials />
    case "NewsletterSignup":
      return <PreviewNewsletter />
    case "StoreInfo":
      return <PreviewStoreInfo storeName={storeName} />
    default:
      return null
  }
}

// =============================================================================
// Simple placeholder previews for non-MENA sections
// =============================================================================

function PreviewFeaturedCollections() {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div className="px-4 py-4">
      <p className="text-[10px] font-medium mb-2" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "التشكيلات" : "Collections"}
      </p>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 aspect-[4/3] rounded-lg"
            style={{ backgroundColor: "var(--preview-muted-bg)" }}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewTestimonials() {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-medium mb-2" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "آراء العملاء" : "Reviews"}
      </p>
      <div
        className="rounded-lg p-3 border"
        style={{ borderColor: "var(--preview-border)" }}
      >
        <div className="flex gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-[10px]" style={{ color: "var(--preview-accent)" }}>
              ★
            </span>
          ))}
        </div>
        <p className="text-[9px] italic" style={{ color: "var(--preview-muted)" }}>
          {isAr ? '"منتجات ممتازة وتوصيل سريع"' : '"Excellent products and fast delivery"'}
        </p>
      </div>
    </div>
  )
}

function PreviewNewsletter() {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div className="px-4 py-3" style={{ backgroundColor: "var(--preview-muted-bg)" }}>
      <p className="text-[10px] font-medium text-center mb-1" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "اشترك في النشرة" : "Newsletter"}
      </p>
      <div className="flex gap-1">
        <div
          className="flex-1 h-6 rounded border text-[8px] flex items-center px-2"
          style={{ borderColor: "var(--preview-border)", color: "var(--preview-muted)" }}
        >
          {isAr ? "بريدك الإلكتروني" : "your@email.com"}
        </div>
        <div
          className="h-6 px-2 rounded text-[8px] text-white flex items-center"
          style={{ backgroundColor: "var(--preview-accent)" }}
        >
          {isAr ? "اشترك" : "Subscribe"}
        </div>
      </div>
    </div>
  )
}

function PreviewStoreInfo({ storeName }: { storeName?: string }) {
  const locale = useLocale()
  const isAr = locale === "ar"

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--preview-foreground)" }}>
        {isAr ? "عن المتجر" : "About"}
      </p>
      <p className="text-[9px]" style={{ color: "var(--preview-muted)" }}>
        {isAr
          ? `مرحباً بكم في ${storeName || "متجرنا"}`
          : `Welcome to ${storeName || "our store"}`}
      </p>
    </div>
  )
}
