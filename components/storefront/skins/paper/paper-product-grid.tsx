import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { ShoppingBag, Eye, SlidersHorizontal } from "lucide-react"

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

interface PaperProductGridConfig {
  titleKey?: string
  subtitleKey?: string
  products?: ProductItem[]
  columns?: 2 | 3 | 4
  showPrices?: boolean
}

function formatCurrency(locale: string, value: number, currency?: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function PaperProductCard({
  product,
  locale,
  showPrice,
  t,
}: {
  product: ProductItem
  locale: string
  showPrice: boolean
  t: (key: string) => string
}) {
  const name = product.nameKey ? t(product.nameKey) : product.name || ""
  const href = `/${locale}/product/${product.id}`
  const isRtl = locale === "ar"

  return (
    <Link href={href} className="group block">
      <article
        className={cn(
          "border border-neutral-200 bg-white",
          "transition-colors duration-200",
          "hover:border-neutral-400",
          "focus-within:ring-2 focus-within:ring-[var(--theme-primary)] focus-within:ring-offset-1"
        )}
      >
        {/* Image -- aspect-square, sharp corners, with Quick View overlay on hover */}
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="size-10 text-neutral-200" />
            </div>
          )}

          {/* Badge -- rectangular, top-start */}
          {product.badgeKey && (
            <span
              className={cn(
                "absolute top-2 start-2 bg-[var(--theme-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              )}
            >
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

          {showPrice && typeof product.price === "number" && (
            <p className="text-sm font-semibold text-[var(--theme-foreground)]">
              {formatCurrency(locale, product.price, product.currency)}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export async function PaperProductGrid({
  config,
  locale,
}: ThemeComponentProps<PaperProductGridConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "products.title",
    subtitleKey = "products.subtitle",
    products = [],
    columns = 4,
    showPrices = true,
  } = config

  const isRtl = locale === "ar"

  const gridCols =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-[var(--theme-background)] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header: title left, filter/sort visual right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-neutral-200 pb-4">
          <div className="space-y-1">
            <h2
              className="text-xl sm:text-2xl font-bold text-[var(--theme-foreground)] tracking-tight"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {t(titleKey)}
            </h2>
            <p className="text-sm text-neutral-500">
              {t(subtitleKey)}
            </p>
          </div>

          {/* Filter/sort visual hint (non-functional) */}
          <div className="flex items-center gap-4 text-sm text-neutral-500 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 cursor-pointer hover:text-[var(--theme-foreground)] transition-colors duration-150">
              <SlidersHorizontal className="size-3.5" />
              {t("products.filter") ?? "Filter"}
            </span>
            <span className="hidden sm:inline text-neutral-300">|</span>
            <span className="hidden sm:inline cursor-pointer hover:text-[var(--theme-foreground)] transition-colors duration-150">
              {t("products.sort") ?? "Sort"}
            </span>
          </div>
        </div>

        {/* Product grid or empty state */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 py-20 px-6">
            <ShoppingBag className="size-12 text-neutral-200 mb-3" />
            <p className="text-sm text-neutral-400 text-center max-w-xs">
              {t("products.empty")}
            </p>
          </div>
        ) : (
          <div className={cn("grid gap-4", gridCols)}>
            {products.map((product) => (
              <PaperProductCard
                key={product.id}
                product={product}
                locale={locale}
                showPrice={showPrices}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
