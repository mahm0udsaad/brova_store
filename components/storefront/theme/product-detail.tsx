import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductInfo {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  price: number
  compare_at_price?: number
  images: string[]
  sizes?: string[]
  colors?: string[]
  category?: string
}

interface RelatedProductItem {
  id: string
  name: string
  price: number
  imageUrl: string
}

interface ProductDetailConfig {
  product?: ProductInfo
  showRelatedProducts?: boolean
  relatedProducts?: RelatedProductItem[]
}

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

function ImageGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const mainImage = images[0]
  const thumbnails = images.slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={alt}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--theme-muted)]">
            No image
          </div>
        )}
      </div>

      {thumbnails.length > 1 ? (
        <div className="flex gap-2">
          {thumbnails.map((src, i) => (
            <button
              key={i}
              className={cn(
                "relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-neutral-100 transition",
                i === 0
                  ? "border-[var(--theme-primary)]"
                  : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
              )}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SizeSelector({
  sizes,
  label,
}: {
  sizes: string[]
  label: string
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size, i) => (
          <button
            key={size}
            className={cn(
              "flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition",
              i === 0
                ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                : "border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-[var(--theme-primary)]"
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorSelector({
  colors,
  label,
}: {
  colors: string[]
  label: string
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, i) => (
          <button
            key={color}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
              i === 0
                ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
                : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]"
            )}
          >
            <span
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function QuantityPicker({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="inline-flex items-center rounded-lg border border-[var(--theme-border)]">
        <button className="flex h-10 w-10 items-center justify-center text-[var(--theme-foreground)] transition hover:bg-[var(--theme-accent)]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="flex h-10 w-10 items-center justify-center border-x border-[var(--theme-border)] text-sm font-medium text-[var(--theme-foreground)]">
          1
        </span>
        <button className="flex h-10 w-10 items-center justify-center text-[var(--theme-foreground)] transition hover:bg-[var(--theme-accent)]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function RelatedProductCard({
  product,
  locale,
}: {
  product: RelatedProductItem
  locale: string
}) {
  return (
    <article className="group rounded-2xl border border-[var(--theme-border)] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="text-sm font-medium text-start">{product.name}</h3>
        <div className="text-sm font-semibold" dir="ltr">
          {formatCurrency(locale, product.price)}
        </div>
      </div>
    </article>
  )
}

export async function ProductDetail({
  config,
  locale,
}: ThemeComponentProps<ProductDetailConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    product,
    showRelatedProducts = false,
    relatedProducts = [],
  } = config

  if (!product) {
    return (
      <section className="bg-[var(--theme-background)] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-sm text-[var(--theme-muted)]">
            {t("products.empty")}
          </div>
        </div>
      </section>
    )
  }

  const isAr = locale === "ar"
  const productName = isAr && product.name_ar ? product.name_ar : product.name
  const productDescription =
    isAr && product.description_ar
      ? product.description_ar
      : product.description
  const hasDiscount =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price

  return (
    <section className="bg-[var(--theme-background)] py-12 text-[var(--theme-foreground)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Product main layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          {/* Image gallery */}
          <ImageGallery images={product.images} alt={productName} />

          {/* Product info */}
          <div className="flex flex-col gap-6">
            {/* Category */}
            {product.category ? (
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--theme-muted)]">
                {product.category}
              </span>
            ) : null}

            {/* Name */}
            <h1 className="text-2xl font-semibold sm:text-3xl text-start">
              {productName}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3" dir="ltr">
              <span className="text-xl font-bold text-[var(--theme-foreground)]">
                {formatCurrency(locale, product.price)}
              </span>
              {hasDiscount ? (
                <span className="text-base text-[var(--theme-muted)] line-through">
                  {formatCurrency(locale, product.compare_at_price!)}
                </span>
              ) : null}
              {hasDiscount ? (
                <span className="rounded-full bg-[var(--theme-accent)] px-2.5 py-0.5 text-xs font-semibold text-white">
                  {Math.round(
                    ((product.compare_at_price! - product.price) /
                      product.compare_at_price!) *
                      100
                  )}
                  % OFF
                </span>
              ) : null}
            </div>

            {/* Short description */}
            {productDescription ? (
              <p className="text-sm leading-relaxed text-[var(--theme-muted)] text-start">
                {productDescription}
              </p>
            ) : null}

            {/* Divider */}
            <hr className="border-[var(--theme-border)]" />

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 ? (
              <SizeSelector
                sizes={product.sizes}
                label={isAr ? "المقاس" : "Size"}
              />
            ) : null}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 ? (
              <ColorSelector
                colors={product.colors}
                label={isAr ? "اللون" : "Color"}
              />
            ) : null}

            {/* Quantity picker */}
            <QuantityPicker label={isAr ? "الكمية" : "Quantity"} />

            {/* Add to cart */}
            <Button
              className="w-full rounded-full py-6 text-base font-semibold bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary)]/90"
            >
              {isAr ? "أضف إلى السلة" : "Add to Cart"}
            </Button>
          </div>
        </div>

        {/* Description section */}
        {productDescription ? (
          <div className="mt-12 border-t border-[var(--theme-border)] pt-8">
            <h2 className="text-lg font-semibold text-start">
              {isAr ? "الوصف" : "Description"}
            </h2>
            <div className="mt-4 text-sm leading-relaxed text-[var(--theme-muted)] text-start">
              {productDescription}
            </div>
          </div>
        ) : null}

        {/* Related products */}
        {showRelatedProducts && relatedProducts.length > 0 ? (
          <div className="mt-12 border-t border-[var(--theme-border)] pt-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-start">
                {isAr ? "منتجات ذات صلة" : "Related Products"}
              </h2>
              <p className="text-sm text-[var(--theme-muted)]">
                {isAr
                  ? "منتجات قد تعجبك أيضاً"
                  : "You might also like these"}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <RelatedProductCard
                  key={item.id}
                  product={item}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
