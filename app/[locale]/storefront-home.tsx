/**
 * Storefront Home Page
 *
 * Tenant-safe, theme-driven storefront rendering.
 * Loads the store's component tree from the DB and renders it
 * via ThemeRenderer with real products, categories, and banners injected.
 */

import { notFound } from 'next/navigation'
import {
  getStorefrontContext,
  getStorefrontProducts,
  getStorefrontComponents,
  getStorefrontSettings,
  getStorefrontBanners,
  getStorefrontCategoryEntities,
  type StorefrontProduct,
  type StorefrontBanner,
  type StorefrontCategory,
} from '@/lib/supabase/queries/storefront'
import { ThemeRenderer } from '@/lib/theme/renderer'
import { resolveSkin } from '@/components/storefront/skins'
import { classicTemplate } from '@/lib/theme/templates'
import { StorefrontShell } from '@/components/storefront/cart/storefront-shell'
import type { ComponentNode, ThemeSettings } from '@/types/theme'

interface StorefrontHomeProps {
  locale: 'en' | 'ar'
  orgSlug: string
}

export async function StorefrontHome({ locale, orgSlug }: StorefrontHomeProps) {
  const context = await getStorefrontContext(orgSlug)

  if (!context) {
    return notFound()
  }

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

  // Load everything in parallel (including skin resolution)
  const [components, products, settings, banners, categories, skinRegistry] = await Promise.all([
    getStorefrontComponents(context.store.id),
    getStorefrontProducts(context.store.id, { limit: 100 }),
    getStorefrontSettings(context.store.id),
    getStorefrontBanners(context.store.id),
    getStorefrontCategoryEntities(context.store.id),
    resolveSkin(context.store.skin_id),
  ])

  // Build theme settings from DB or use defaults
  const themeSettings = buildThemeSettings(settings?.theme_config, settings?.appearance)

  // Convert DB components to ComponentNode[] and inject real data
  let nodes = dbComponentsToNodes(components)

  // If store has no components yet (e.g. skipped onboarding), use classic template
  if (nodes.length === 0) {
    nodes = classicTemplate.nodes
  }

  // Inject real products, banners, and categories into component configs
  nodes = enrichNodes(nodes, products, banners, categories, locale, context.store.name)

  return (
    <StorefrontShell>
      <ThemeRenderer
        nodes={nodes}
        registry={skinRegistry}
        locale={locale}
        settings={themeSettings}
      />
    </StorefrontShell>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function buildThemeSettings(
  themeConfig: Record<string, any> | null | undefined,
  appearance: Record<string, any> | null | undefined,
): ThemeSettings {
  const colors = themeConfig?.colors || {}
  const typography = themeConfig?.typography || {}

  return {
    palette: {
      primary: colors.primary || appearance?.primary_color || '#111827',
      secondary: colors.secondary || '#6B7280',
      accent: colors.accent || appearance?.accent_color || '#111827',
      background: colors.background || '#F9FAFB',
      foreground: '#0F172A',
      muted: '#6B7280',
      border: '#E5E7EB',
    },
    typography: {
      fontBody: typography.fontBody || appearance?.font_family || '"Geist", system-ui, sans-serif',
      fontHeading: typography.fontHeading || appearance?.font_family || '"Geist", system-ui, sans-serif',
    },
    radius: '16px',
  }
}

function dbComponentsToNodes(
  components: { id: string; component_type: string; config: Record<string, unknown>; position: number; status: string }[]
): ComponentNode[] {
  return components.map((c) => ({
    id: c.id,
    type: c.component_type as ComponentNode['type'],
    config: c.config || {},
    order: c.position,
    visible: c.status === 'active',
  }))
}

/**
 * Inject real data (products, banners, categories) into component configs
 * so the theme components render actual store data instead of template placeholders.
 */
function enrichNodes(
  nodes: ComponentNode[],
  products: StorefrontProduct[],
  banners: StorefrontBanner[],
  categories: StorefrontCategory[],
  locale: string,
  storeName: string,
): ComponentNode[] {
  const productItems = products.map((p) => ({
    id: p.id,
    name: locale === 'ar' ? (p.name_ar || p.name) : p.name,
    price: p.price,
    imageUrl: p.image_url || p.images?.[0] || '/placeholder.png',
    slug: p.slug,
  }))

  const heroBanner = banners.find((b) => b.position === 'hero')

  const categoryItems = categories.map((c) => ({
    id: c.id,
    name: locale === 'ar' ? (c.name_ar || c.name) : c.name,
    slug: c.slug,
    imageUrl: c.image_url || undefined,
  }))

  return nodes.map((node) => {
    const config = { ...node.config }

    switch (node.type) {
      case 'ProductGrid':
        // Inject real products if no products in config or they're placeholders
        if (productItems.length > 0) {
          config.products = productItems
          config.showPrices = true
        }
        break

      case 'ProductCarousel':
        if (productItems.length > 0) {
          config.products = productItems
        }
        break

      case 'HeroBanner':
        // Inject hero banner data from store_banners if available
        if (heroBanner) {
          if (heroBanner.image_url) config.backgroundUrl = heroBanner.image_url
          if (heroBanner.title || heroBanner.title_ar) {
            config.titleOverride = locale === 'ar'
              ? (heroBanner.title_ar || heroBanner.title)
              : (heroBanner.title || heroBanner.title_ar)
          }
          if (heroBanner.subtitle || heroBanner.subtitle_ar) {
            config.subtitleOverride = locale === 'ar'
              ? (heroBanner.subtitle_ar || heroBanner.subtitle)
              : (heroBanner.subtitle || heroBanner.subtitle_ar)
          }
        }
        break

      case 'CategoryBrowser':
        if (categoryItems.length > 0) {
          config.categories = categoryItems
        }
        break

      case 'StoreHeader':
        config.logoText = storeName
        break

      case 'StoreFooter':
        config.storeName = storeName
        break
    }

    return { ...node, config }
  })
}
