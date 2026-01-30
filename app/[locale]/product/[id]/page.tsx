/**
 * Product Detail Page
 *
 * Tenant-safe product detail rendering with theme support
 */

import { notFound } from 'next/navigation'
import { getStorefrontContext, getStorefrontProduct } from '@/lib/supabase/queries/storefront'
import { resolveTheme } from '@/lib/themes'
import type { Locale } from '@/i18n'
import { resolveTenant } from '@/lib/tenant-resolver'

interface ProductPageProps {
  params: Promise<{
    locale: Locale
    id: string
  }>
}

export default async function ProductPage(props: ProductPageProps) {
  const { locale, id } = await props.params

  // Detect tenant via domain/subdomain
  const orgSlug = await resolveTenant()

  // Get store context
  const context = await getStorefrontContext(orgSlug)

  if (!context) {
    return notFound()
  }

  // Check store status
  if (context.store.status !== 'active') {
    return notFound()
  }

  // Get product (tenant-verified, active only)
  const product = await getStorefrontProduct(id, context.store.id)

  if (!product) {
    return notFound()
  }

  // Resolve theme
  const theme = resolveTheme(context.store.theme_id, context.store.type)

  const { ProductDetail } = theme.components

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <ProductDetail
        product={product}
        locale={locale}
        storeName={context.store.name}
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
