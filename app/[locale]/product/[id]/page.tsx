/**
 * Product Detail Page
 *
 * Tenant-safe product detail rendering with theme support.
 * Loads store settings for theme colors and renders the product
 * using the ProductDetail theme component with correct props.
 */

import { notFound } from 'next/navigation'
import {
  getStorefrontContext,
  getStorefrontProduct,
  getStorefrontSettings,
} from '@/lib/supabase/queries/storefront'
import { resolveSkin } from '@/components/storefront/skins'
import type { Locale } from '@/i18n'
import type { ThemeSettings } from '@/types/theme'
import { resolveTenant } from '@/lib/tenant-resolver'

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

export default async function ProductPage(props: ProductPageProps) {
  const { locale, id } = await props.params
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
  const SkinProductDetail = skinRegistry.ProductDetail

  const productConfig = {
    product: {
      id: product.id,
      name: product.name,
      name_ar: product.name_ar || undefined,
      description: product.description || undefined,
      description_ar: product.description_ar || undefined,
      price: product.price,
      images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
      category: product.category || undefined,
    },
  }

  return (
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
      <SkinProductDetail
        config={productConfig}
        locale={locale}
        theme={theme}
      />
    </div>
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
