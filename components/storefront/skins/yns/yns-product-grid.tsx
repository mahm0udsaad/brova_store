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

interface YnsProductGridConfig {
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

function YnsProductCard({
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
      <article className="overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Image container — 3:4 aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50">
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

          {showPrice && typeof product.price === "number" && (
            <p className="text-sm font-semibold text-[var(--theme-primary)]">
              {formatCurrency(locale, product.price, product.currency)}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export async function YnsProductGrid({
  config,
  locale,
}: ThemeComponentProps<YnsProductGridConfig>) {
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
      className="bg-[var(--theme-background)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div className="space-y-2">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[var(--theme-foreground)] tracking-tight"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {t(titleKey)}
            </h2>
            <p className="text-sm sm:text-base text-[var(--theme-muted)]">
              {t(subtitleKey)}
            </p>
          </div>

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

        {/* Product grid or empty state */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-20 px-6">
            <ShoppingBag className="size-16 text-neutral-200 mb-4" />
            <p className="text-sm text-[var(--theme-muted)] text-center max-w-xs">
              {t("products.empty")}
            </p>
          </div>
        ) : (
          <div className={cn("grid gap-5 sm:gap-6", gridCols)}>
            {products.map((product) => (
              <YnsProductCard
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
