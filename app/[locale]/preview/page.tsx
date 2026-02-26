import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeRenderer } from '@/lib/theme/renderer'
import { themeComponentRegistry } from '@/lib/theme/registry'
import { resolveSkin } from '@/components/storefront/skins'
import { getTemplateById, classicTemplate } from '@/lib/theme/templates'
import {
  getStorefrontProducts,
  getStorefrontComponents,
  getStorefrontSettings,
  getStorefrontBanners,
  getStorefrontCategoryEntities,
} from '@/lib/supabase/queries/storefront'
import type { ComponentNode, ThemeSettings } from '@/types/theme'

interface PreviewPageProps {
  searchParams: Promise<{ token?: string; template?: string }>
  params: Promise<{ locale: string }>
}

/**
 * Preview Page
 *
 * - ?template=<id> → renders a template with placeholder data
 * - ?token=<hex>   → renders a real store in preview mode
 */
export default async function PreviewPage({ searchParams, params }: PreviewPageProps) {
  const { token, template } = await searchParams
  const { locale } = await params

  // Template preview (no auth needed)
  if (!token && template) {
    const selectedTemplate = getTemplateById(template) ?? classicTemplate
    return (
      <ThemeRenderer
        nodes={selectedTemplate.nodes}
        registry={themeComponentRegistry}
        locale={locale as any}
        settings={selectedTemplate.settings}
        preview
      />
    )
  }

  if (!token) {
    notFound()
  }

  const supabase = await createClient()

  // Validate preview token
  const { data: previewToken, error } = await supabase
    .from('store_preview_tokens')
    .select(`
      id,
      store_id,
      expires_at,
      stores (
        id,
        name,
        slug,
        status,
        store_type,
        skin_id,
        theme_id,
        organization_id
      )
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !previewToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Preview Link Expired
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This preview link is no longer valid. Please request a new preview link from the store owner.
          </p>
          <a
            href={`/${locale}`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  const store = previewToken.stores as any
  if (!store) {
    notFound()
  }

  // Load store data in parallel
  const [components, products, settings, banners, categories, skinRegistry] = await Promise.all([
    getStorefrontComponents(store.id),
    getStorefrontProducts(store.id, { limit: 100 }),
    getStorefrontSettings(store.id),
    getStorefrontBanners(store.id),
    getStorefrontCategoryEntities(store.id),
    resolveSkin(store.skin_id),
  ])

  // Build theme settings
  const themeConfig = settings?.theme_config as Record<string, any> | null
  const appearance = settings?.appearance as Record<string, any> | null
  const colors = themeConfig?.colors || {}
  const typography = themeConfig?.typography || {}

  const themeSettings: ThemeSettings = {
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

  // Convert DB components to nodes
  let nodes: ComponentNode[] = components.map((c) => ({
    id: c.id,
    type: c.component_type as ComponentNode['type'],
    config: c.config || {},
    order: c.position,
    visible: c.status === 'active',
  }))

  if (nodes.length === 0) {
    nodes = classicTemplate.nodes
  }

  // Inject real data into component configs
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

  nodes = nodes.map((node) => {
    const config = { ...node.config }
    switch (node.type) {
      case 'ProductGrid':
      case 'ProductCarousel':
        if (productItems.length > 0) {
          config.products = productItems
          config.showPrices = true
        }
        break
      case 'HeroBanner':
        if (heroBanner) {
          if (heroBanner.image_url) config.backgroundUrl = heroBanner.image_url
          if (heroBanner.title || heroBanner.title_ar) {
            config.titleOverride = locale === 'ar'
              ? (heroBanner.title_ar || heroBanner.title)
              : (heroBanner.title || heroBanner.title_ar)
          }
        }
        break
      case 'CategoryBrowser':
        if (categoryItems.length > 0) config.categories = categoryItems
        break
      case 'StoreHeader':
        config.logoText = store.name
        break
      case 'StoreFooter':
        config.storeName = store.name
        break
    }
    return { ...node, config }
  })

  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black py-2 px-4 text-center text-sm font-medium shadow-md">
        <span className="me-2">🔍</span>
        <span>Preview Mode</span>
        <span className="mx-2">·</span>
        <span className="font-normal">This store is not yet published. Only people with this link can view it.</span>
      </div>

      <div className="pt-10">
        <ThemeRenderer
          nodes={nodes}
          registry={skinRegistry}
          locale={locale as any}
          settings={themeSettings}
          preview
        />
      </div>
    </div>
  )
}
