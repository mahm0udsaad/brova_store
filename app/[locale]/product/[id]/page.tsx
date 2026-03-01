/**
 * Product Detail Page
 *
 * Tenant-safe product detail rendering with theme support.
 * Server component renders product info; client AddToCartSection handles interactivity.
 */

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  getStorefrontContext,
  getStorefrontProduct,
  getStorefrontSettings,
} from '@/lib/supabase/queries/storefront'
import { resolveSkin } from '@/components/storefront/skins'
import type { Locale } from '@/i18n'
import type { ThemeSettings } from '@/types/theme'
import type { StorefrontProductInfo } from '@/types'
import { resolveTenant } from '@/lib/tenant-resolver'
import { StorefrontShell } from '@/components/storefront/cart/storefront-shell'
import { AddToCartSection } from '@/components/storefront/cart/add-to-cart-section'
import { cn } from '@/lib/utils'

interface ProductPageProps {
  params: Promise<{
    locale: Locale
    id: string
  }>
}

function buildThemeSettings(
  settings: { theme_config: any; appearance: any } | null,
): ThemeSettings {
  const colors = settings?.theme_config?.colors || {}
  const typography = settings?.theme_config?.typography || {}
  const appearance = settings?.appearance || {}

  return {
    palette: {
      primary: colors.primary || appearance.primary_color || '#111827',
      secondary: colors.secondary || '#6B7280',
      accent: colors.accent || appearance.accent_color || '#111827',
      background: colors.background || '#F9FAFB',
      foreground: '#0F172A',
      muted: '#6B7280',
      border: '#E5E7EB',
    },
    typography: {
      fontBody: typography.fontBody || appearance.font_family || '"Geist", system-ui, sans-serif',
      fontHeading: typography.fontHeading || appearance.font_family || '"Geist", system-ui, sans-serif',
    },
    radius: '16px',
  }
}

function formatCurrency(locale: string, value: number) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function ProductPage(props: ProductPageProps) {
  const { locale, id } = await props.params
  const t = await getTranslations({ locale, namespace: 'storefront' })
  const orgSlug = await resolveTenant()
  const context = await getStorefrontContext(orgSlug)

  if (!context || context.store.status !== 'active') {
    return notFound()
  }

  const [product, settings, skinRegistry] = await Promise.all([
    getStorefrontProduct(id, context.store.id),
    getStorefrontSettings(context.store.id),
    resolveSkin(context.store.skin_id),
  ])

  if (!product) {
    return notFound()
  }

  const theme = buildThemeSettings(settings)
  const isAr = locale === 'ar'
  const productName = isAr && product.name_ar ? product.name_ar : product.name
  const productDesc = isAr && product.description_ar ? product.description_ar : (product.description || undefined)
  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : [])

  // Serializable product info for client component
  const productInfo: StorefrontProductInfo = {
    id: product.id,
    name: productName,
    name_ar: product.name_ar || undefined,
    description: productDesc,
    description_ar: product.description_ar || undefined,
    price: product.price,
    currency: product.currency || 'SAR',
    image: images[0] || '',
    images,
    category: product.category || undefined,
  }

  // Render header using skin
  const SkinHeader = skinRegistry.StoreHeader
  const SkinFooter = skinRegistry.StoreFooter

  return (
    <StorefrontShell>
      <div
        className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-foreground)]"
        style={{
          '--theme-primary': theme.palette.primary,
          '--theme-secondary': theme.palette.secondary,
          '--theme-accent': theme.palette.accent,
          '--theme-background': theme.palette.background,
          '--theme-foreground': theme.palette.foreground,
          '--theme-muted': theme.palette.muted,
          '--theme-border': theme.palette.border,
          '--theme-radius': theme.radius,
          '--theme-font-body': theme.typography.fontBody,
          '--theme-font-heading': theme.typography.fontHeading,
        } as React.CSSProperties}
      >
        {/* Header */}
        <SkinHeader
          config={{ logoText: context.store.name, sticky: true }}
          locale={locale}
          theme={theme}
        />

        {/* Product detail */}
        <section className="py-8 sm:py-14" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-xs text-[var(--theme-muted)]">
              <Link href={`/${locale}`} className="hover:text-[var(--theme-foreground)] transition-colors">
                {t('header.home')}
              </Link>
              <span>/</span>
              <Link href={`/${locale}`} className="hover:text-[var(--theme-foreground)] transition-colors">
                {t('header.shop')}
              </Link>
              {product.category && (
                <>
                  <span>/</span>
                  <span className="text-[var(--theme-foreground)] font-medium">{product.category}</span>
                </>
              )}
            </nav>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
              {/* Image gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-50">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={productName}
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
                {images.length > 1 && (
                  <div className="flex gap-3">
                    {images.slice(0, 5).map((src, i) => (
                      <div
                        key={i}
                        className={cn(
                          'relative aspect-square w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-neutral-50 transition-all',
                          i === 0
                            ? 'ring-2 ring-[var(--theme-primary)] ring-offset-2'
                            : 'opacity-60 hover:opacity-100'
                        )}
                      >
                        <Image
                          src={src}
                          alt={`${productName} ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product info + interactive cart */}
              <div className="flex flex-col gap-6">
                {/* Category tag */}
                {product.category && (
                  <span className="inline-block w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-600">
                    {product.category}
                  </span>
                )}

                {/* Name */}
                <h1
                  className="text-2xl font-bold leading-tight text-start sm:text-3xl"
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                >
                  {productName}
                </h1>

                {/* Price */}
                <div className="flex items-baseline gap-3" dir="ltr">
                  <span className="text-2xl font-bold text-[var(--theme-primary)]">
                    {formatCurrency(locale, product.price)}
                  </span>
                </div>

                {/* Short description */}
                {productDesc && (
                  <p className="text-sm leading-relaxed text-neutral-500 text-start">
                    {productDesc}
                  </p>
                )}

                {/* Divider */}
                <div className="h-px bg-neutral-100" />

                {/* Interactive add-to-cart section (client component) */}
                <AddToCartSection product={productInfo} />
              </div>
            </div>

            {/* Full description section */}
            {productDesc && (
              <div className="mt-16">
                <div className="h-px bg-neutral-100" />
                <div className="pt-10">
                  <h2 className="text-lg font-semibold text-start">
                    {t('productDetail.description')}
                  </h2>
                  <div className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-500 text-start">
                    {productDesc}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <SkinFooter
          config={{ storeName: context.store.name }}
          locale={locale}
          theme={theme}
        />
      </div>
    </StorefrontShell>
  )
}

/**
 * Generate metadata for the product page (SEO)
 */
export async function generateMetadata(props: ProductPageProps) {
  const { locale, id } = await props.params

  const orgSlug = await resolveTenant()
  const context = await getStorefrontContext(orgSlug)

  if (!context) {
    return {
      title: 'Product Not Found',
    }
  }

  const product = await getStorefrontProduct(id, context.store.id)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
  const description = locale === 'ar' && product.description_ar ? product.description_ar : product.description

  return {
    title: `${name} | ${context.store.name}`,
    description: description || `${name} - Available at ${context.store.name}`,
    openGraph: {
      title: name,
      description: description || undefined,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  }
}
