import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface PaperProductDetailConfig {
  product?: ProductInfo
  showRelatedProducts?: boolean
  relatedProducts?: RelatedProductItem[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const mainImage = images[0]
  const thumbnails = images.slice(0, 5)

  return (
    <div className="space-y-3">
      {/* Main image — sharp edges, no rounding */}
      <div className="relative aspect-square overflow-hidden border border-neutral-200 bg-neutral-50">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* Horizontal thumbnail strip */}
      {thumbnails.length > 1 && (
        <div className="flex gap-2">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={cn(
                "relative aspect-square w-16 shrink-0 cursor-pointer overflow-hidden border bg-neutral-50 transition-all",
                i === 0
                  ? "border-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]"
                  : "border-neutral-200 opacity-70 hover:opacity-100 hover:border-neutral-400"
              )}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SizeSelector({ sizes, label }: { sizes: string[]; label: string }) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size, i) => (
          <span
            key={size}
            className={cn(
              "flex h-10 min-w-[2.75rem] items-center justify-center border px-4 text-sm font-medium transition-all cursor-pointer select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-1",
              i === 0
                ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                : "border-neutral-300 bg-white text-[var(--theme-foreground)] hover:border-[var(--theme-foreground)]"
            )}
          >
            {size}
          </span>
        ))}
      </div>
    </div>
  )
}

function ColorSelector({ colors, label }: { colors: string[]; label: string }) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color, i) => (
          <span
            key={color}
            className={cn(
              "flex h-9 w-9 items-center justify-center cursor-pointer transition-all border",
              i === 0
                ? "border-[var(--theme-foreground)] ring-1 ring-[var(--theme-foreground)] ring-offset-1"
                : "border-neutral-200 hover:border-neutral-400"
            )}
          >
            <span
              className="h-7 w-7"
              style={{ backgroundColor: color }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

function QuantityPicker({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-[var(--theme-foreground)]">
        {label}
      </span>
      <div className="inline-flex items-center border border-neutral-300">
        <span className="flex h-10 w-10 items-center justify-center cursor-pointer text-[var(--theme-foreground)] transition hover:bg-neutral-100 border-e border-neutral-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        </span>
        <span className="flex h-10 w-12 items-center justify-center text-sm font-semibold text-[var(--theme-foreground)] tabular-nums">
          1
        </span>
        <span className="flex h-10 w-10 items-center justify-center cursor-pointer text-[var(--theme-foreground)] transition hover:bg-neutral-100 border-s border-neutral-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
        </span>
      </div>
    </div>
  )
}

function DescriptionTabs({
  description,
  descriptionLabel,
  detailsLabel,
}: {
  description: string
  descriptionLabel: string
  detailsLabel: string
}) {
  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b border-neutral-200">
        <span className="cursor-pointer border-b-2 border-[var(--theme-foreground)] px-5 py-3 text-sm font-semibold text-[var(--theme-foreground)]">
          {descriptionLabel}
        </span>
        <span className="cursor-pointer px-5 py-3 text-sm font-medium text-neutral-400 transition hover:text-neutral-600">
          {detailsLabel}
        </span>
      </div>
      {/* Tab content */}
      <div className="py-6 text-sm leading-relaxed text-neutral-600 text-start">
        {description}
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
    <Link
      href={`/${locale}/product/${product.id}`}
      className="group block"
    >
      <article className="border border-neutral-200 transition-colors hover:border-neutral-400">
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : null}
        </div>
        <div className="border-t border-neutral-200 p-3 space-y-1">
          <h3 className="text-sm font-medium text-[var(--theme-foreground)] line-clamp-1 text-start">
            {product.name}
          </h3>
          <div
            className="text-sm font-semibold text-[var(--theme-foreground)]"
            dir="ltr"
          >
            {formatCurrency(locale, product.price)}
          </div>
        </div>
      </article>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export async function PaperProductDetail({
  config,
  locale,
}: ThemeComponentProps<PaperProductDetailConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    product,
    showRelatedProducts = false,
    relatedProducts = [],
  } = config

  /* Empty state */
  if (!product) {
    return (
      <section className="bg-[var(--theme-background)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center border border-neutral-200">
            <div className="flex h-16 w-16 items-center justify-center border border-neutral-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500">
              {t("productDetail.noProduct")}
            </p>
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
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0

  return (
    <section className="bg-[var(--theme-background)] py-10 text-[var(--theme-foreground)] sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Two-column layout ---- */}
        <div
          className={cn(
            "grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12",
            isAr && "md:direction-rtl"
          )}
        >
          {/* Image gallery */}
          <ImageGallery images={product.images} alt={productName} />

          {/* Product info */}
          <div className="flex flex-col gap-6">
            {/* Breadcrumb-style category */}
            {product.category && (
              <nav className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="hover:text-[var(--theme-foreground)] cursor-pointer transition-colors">
                  {t("header.shop")}
                </span>
                <span className="text-neutral-300">/</span>
                <span className="text-[var(--theme-foreground)] font-medium">
                  {product.category}
                </span>
              </nav>
            )}

            {/* Product name */}
            <h1
              className="text-2xl font-bold leading-tight text-start sm:text-3xl"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {productName}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3" dir="ltr">
              <span className="text-2xl font-bold text-[var(--theme-foreground)]">
                {formatCurrency(locale, product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-neutral-400 line-through">
                    {formatCurrency(locale, product.compare_at_price!)}
                  </span>
                  <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200" />

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <SizeSelector
                sizes={product.sizes}
                label={t("productDetail.size")}
              />
            )}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <ColorSelector
                colors={product.colors}
                label={t("productDetail.color")}
              />
            )}

            {/* Quantity picker */}
            <QuantityPicker label={t("productDetail.quantity")} />

            {/* Add to Cart — rectangular, full width, h-12 */}
            <Button
              className={cn(
                "h-12 w-full rounded-none text-base font-semibold transition-all",
                "bg-[var(--theme-primary)] text-white",
                "hover:bg-[var(--theme-primary)]/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
              )}
            >
              {t("productDetail.addToCart")}
            </Button>
          </div>
        </div>

        {/* ---- Tabs: Description / Details ---- */}
        {productDescription && (
          <div className="mt-14 border-t border-neutral-200 pt-10">
            <DescriptionTabs
              description={productDescription}
              descriptionLabel={t("productDetail.description")}
              detailsLabel={isAr ? "التفاصيل" : "Details"}
            />
          </div>
        )}

        {/* ---- Related products ---- */}
        {showRelatedProducts && relatedProducts.length > 0 && (
          <div className="mt-14 border-t border-neutral-200 pt-10">
            <h2
              className="text-xl font-semibold text-start"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {t("productDetail.relatedProducts")}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <RelatedProductCard
                  key={item.id}
                  product={item}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
