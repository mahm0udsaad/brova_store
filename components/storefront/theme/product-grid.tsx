import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductItem {
  id: string
  name?: string
  nameKey?: string
  price?: number | null
  imageUrl?: string
  badgeKey?: string
}

interface ProductGridConfig {
  titleKey?: string
  subtitleKey?: string
  products?: ProductItem[]
  columns?: 2 | 3 | 4
  showPrices?: boolean
}

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

function ProductCard({
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
  return (
    <article className="group rounded-2xl border border-[var(--theme-border)] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={name} fill className="object-cover" />
        ) : null}
        {product.badgeKey ? (
          <span className="absolute start-3 top-3 rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-semibold text-white">
            {t(product.badgeKey)}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="text-sm font-medium text-start">{name}</h3>
        {showPrice && typeof product.price === "number" ? (
          <div className="text-sm font-semibold" dir="ltr">
            {formatCurrency(locale, product.price)}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export async function ProductGrid({
  config,
  locale,
}: ThemeComponentProps<ProductGridConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "products.title",
    subtitleKey = "products.subtitle",
    products = [],
    columns = 4,
    showPrices = true,
  } = config

  const gridCols =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-start">{t(titleKey)}</h2>
            <p className="text-sm text-[var(--theme-muted)]">{t(subtitleKey)}</p>
          </div>
          <Button variant="outline" className="rounded-full border-[var(--theme-border)]">
            {t("products.viewAll")}
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-sm text-[var(--theme-muted)]">
            {t("products.empty")}
          </div>
        ) : (
          <div className={cn("mt-8 grid gap-4", gridCols)}>
            {products.map((product) => (
              <ProductCard
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
