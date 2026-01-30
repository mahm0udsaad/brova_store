/**
 * Storefront Home Page
 *
 * Tenant-safe, theme-driven storefront rendering
 * Resolves store by organization slug and renders with appropriate theme
 */

import { notFound } from 'next/navigation'
import { getStorefrontContext, getStorefrontProducts } from '@/lib/supabase/queries/storefront'
import { resolveTheme } from '@/lib/themes'

interface StorefrontHomeProps {
  locale: 'en' | 'ar'
  orgSlug: string
}

export async function StorefrontHome({ locale, orgSlug }: StorefrontHomeProps) {
  // Get store context
  const context = await getStorefrontContext(orgSlug)

  if (!context) {
    return notFound()
  }

  // Check store status
  if (context.store.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            {locale === 'ar' ? 'المتجر غير متاح حالياً' : 'Store Unavailable'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {locale === 'ar'
              ? 'هذا المتجر في حالة مسودة أو معلق. يرجى التحقق مرة أخرى لاحقاً.'
              : 'This store is currently in draft or suspended status. Please check back later.'}
          </p>
        </div>
      </div>
    )
  }

  // Resolve theme
  const theme = resolveTheme(context.store.theme_id, context.store.type)

  // Get active products
  const products = await getStorefrontProducts(context.store.id, { limit: 100 })

  const { Hero, ProductGrid, Footer } = theme.components

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col">
      {/* Hero Section */}
      <Hero
        storeName={context.store.name}
        storeType={context.store.type}
        locale={locale}
      />

      {/* Product Grid */}
      <main className="flex-1">
        <ProductGrid
          products={products}
          locale={locale}
          storeName={context.store.name}
          storeId={context.store.id}
          emptyMessage={
            locale === 'ar'
              ? 'لا توجد منتجات متاحة حالياً'
              : 'No products available at the moment'
          }
        />
      </main>

      {/* Footer */}
      <Footer
        contact={context.contact}
        storeName={context.store.name}
        locale={locale}
      />
    </div>
  )
}