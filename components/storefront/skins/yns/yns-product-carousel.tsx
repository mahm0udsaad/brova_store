import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { ShoppingBag, ArrowRight } from "lucide-react"

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

interface YnsProductCarouselConfig {
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

function YnsCarouselCard({
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
        "w-[260px] sm:w-[280px] md:w-[300px]"
      )}
    >
      <article className="overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Image — 3:4 aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="300px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="size-12 text-neutral-200" />
            </div>
          )}

          {/* Badge */}
          {product.badgeKey && (
            <span className="absolute start-3 top-3 rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {t(product.badgeKey)}
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="p-4 space-y-1.5">
          <h3
            className={cn(
              "text-sm font-medium text-[var(--theme-foreground)] line-clamp-2 leading-snug",
              isRtl ? "text-right" : "text-left"
            )}
          >
            {name}
          </h3>

          {typeof product.price === "number" && (
            <p className="text-sm font-semibold text-[var(--theme-primary)]">
              {formatCurrency(locale, product.price, product.currency)}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export async function YnsProductCarousel({
  config,
  locale,
}: ThemeComponentProps<YnsProductCarouselConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "carousel.title",
    products = [],
  } = config

  const isRtl = locale === "ar"

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-[var(--theme-background)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--theme-foreground)] tracking-tight"
            style={{ fontFamily: "var(--theme-font-heading)" }}
          >
            {t(titleKey)}
          </h2>

          <Link
            href={`/${locale}/search`}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--theme-primary)]",
              "transition-colors duration-200 hover:text-[var(--theme-primary)]/80",
              "shrink-0"
            )}
          >
            {t("products.viewAll")}
            <ArrowRight
              className={cn("size-4", isRtl && "rotate-180")}
            />
          </Link>
        </div>

        {/* Scrollable carousel */}
        <div
          className={cn(
            "flex gap-5 overflow-x-auto pb-4",
            // Scroll snap
            "snap-x snap-mandatory",
            // Thin, themed scrollbar
            "[scrollbar-width:thin]",
            "[scrollbar-color:var(--theme-primary)/30_transparent]",
            // Webkit scrollbar
            "[&::-webkit-scrollbar]:h-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary)]/20",
            "[&::-webkit-scrollbar-thumb:hover]:bg-[var(--theme-primary)]/40",
            // Hide scrollbar on mobile for cleaner look
            "max-sm:scrollbar-none max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden"
          )}
        >
          {products.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-neutral-50 py-20 px-6">
              <ShoppingBag className="size-16 text-neutral-200 mb-4" />
              <p className="text-sm text-[var(--theme-muted)] text-center max-w-xs">
                {t("products.empty")}
              </p>
            </div>
          ) : (
            products.map((product) => (
              <YnsCarouselCard
                key={product.id}
                product={product}
                locale={locale}
                t={t}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
