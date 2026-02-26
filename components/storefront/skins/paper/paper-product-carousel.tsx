import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { ShoppingBag, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductItem {
  id: string
  name?: string
  nameKey?: string
  price?: number | null
  imageUrl?: string
  badgeKey?: string
  slug?: string
  currency?: string
}

interface PaperProductCarouselConfig {
  titleKey?: string
  products?: ProductItem[]
}

function formatCurrency(locale: string, value: number, currency?: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function PaperCarouselCard({
  product,
  locale,
  t,
}: {
  product: ProductItem
  locale: string
  t: (key: string) => string
}) {
  const name = product.nameKey ? t(product.nameKey) : product.name || ""
  const href = `/${locale}/product/${product.id}`
  const isRtl = locale === "ar"

  return (
    <Link
      href={href}
      className={cn(
        "group block shrink-0 snap-start",
        "w-[220px] sm:w-[260px]"
      )}
    >
      <article
        className={cn(
          "border border-neutral-200 bg-white",
          "transition-colors duration-200",
          "hover:border-neutral-400",
          "focus-within:ring-2 focus-within:ring-[var(--theme-primary)] focus-within:ring-offset-1"
        )}
      >
        {/* Image -- aspect-square, sharp corners */}
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="260px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="size-10 text-neutral-200" />
            </div>
          )}

          {/* Badge -- rectangular, top-start */}
          {product.badgeKey && (
            <span className="absolute top-2 start-2 bg-[var(--theme-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t(product.badgeKey)}
            </span>
          )}

          {/* Quick View overlay (visual only) */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200",
              "opacity-0 group-hover:opacity-100 group-hover:bg-black/20"
            )}
          >
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              <Eye className="size-3.5" />
              {t("products.quickView") ?? "Quick View"}
            </span>
          </div>
        </div>

        {/* Product info */}
        <div className="border-t border-neutral-100 px-3 py-3 space-y-1">
          <h3
            className={cn(
              "text-sm font-medium text-[var(--theme-foreground)] line-clamp-1 leading-snug",
              isRtl ? "text-end" : "text-start"
            )}
          >
            {name}
          </h3>

          {typeof product.price === "number" && (
            <p className="text-sm font-semibold text-[var(--theme-foreground)]">
              {formatCurrency(locale, product.price, product.currency)}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export async function PaperProductCarousel({
  config,
  locale,
}: ThemeComponentProps<PaperProductCarouselConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "carousel.title",
    products = [],
  } = config

  const isRtl = locale === "ar"

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-[var(--theme-background)] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header with title and arrow navigation hint */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-200 pb-4">
          <h2
            className="text-xl sm:text-2xl font-bold text-[var(--theme-foreground)] tracking-tight"
            style={{ fontFamily: "var(--theme-font-heading)" }}
          >
            {t(titleKey)}
          </h2>

          {/* Arrow navigation hint (visual, scroll handled via CSS snap) */}
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              className="rounded-none border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-[var(--theme-foreground)] transition-colors duration-150"
              aria-label={isRtl ? "Next" : "Previous"}
            >
              <ChevronLeft className={cn("size-4", isRtl && "rotate-180")} />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="rounded-none border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-[var(--theme-foreground)] transition-colors duration-150"
              aria-label={isRtl ? "Previous" : "Next"}
            >
              <ChevronRight className={cn("size-4", isRtl && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Scrollable carousel */}
        <div className="relative">
          <div
            className={cn(
              "flex gap-3 overflow-x-auto pb-2",
              // Scroll snap
              "snap-x snap-mandatory",
              // Thin scrollbar
              "[scrollbar-width:thin]",
              "[scrollbar-color:var(--theme-border)_transparent]",
              // Webkit scrollbar
              "[&::-webkit-scrollbar]:h-1",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-neutral-200",
              "[&::-webkit-scrollbar-thumb:hover]:bg-neutral-300",
              // Hide scrollbar on mobile
              "max-sm:scrollbar-none max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden"
            )}
          >
            {products.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center border border-dashed border-neutral-200 py-20 px-6">
                <ShoppingBag className="size-12 text-neutral-200 mb-3" />
                <p className="text-sm text-neutral-400 text-center max-w-xs">
                  {t("products.empty")}
                </p>
              </div>
            ) : (
              products.map((product) => (
                <PaperCarouselCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
