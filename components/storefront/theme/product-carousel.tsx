import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface CarouselItem {
  id: string
  name?: string
  nameKey?: string
  price?: number | null
  imageUrl?: string
}

interface ProductCarouselConfig {
  titleKey?: string
  subtitleKey?: string
  products?: CarouselItem[]
}

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export async function ProductCarousel({
  config,
  locale,
}: ThemeComponentProps<ProductCarouselConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "carousel.title",
    subtitleKey = "carousel.subtitle",
    products = [],
  } = config

  return (
    <section className="bg-[var(--theme-background)] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-start">{t(titleKey)}</h2>
          <p className="text-sm text-[var(--theme-muted)]">{t(subtitleKey)}</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="min-w-[220px] rounded-2xl border border-[var(--theme-border)] bg-white p-3"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.nameKey ? t(product.nameKey) : product.name || ""}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                <h3 className="text-sm font-medium text-start">
                  {product.nameKey ? t(product.nameKey) : product.name}
                </h3>
                {typeof product.price === "number" ? (
                  <div className="text-sm font-semibold" dir="ltr">
                    {formatCurrency(locale, product.price)}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
