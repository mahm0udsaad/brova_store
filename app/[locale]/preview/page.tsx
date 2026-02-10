import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomePageClient from '../home-page-client'
import { ThemeRenderer } from '@/lib/theme/renderer'
import { themeComponentRegistry } from '@/lib/theme/registry'
import { getTemplateById, generalTemplate } from '@/lib/theme/templates'

interface PreviewPageProps {
  searchParams: Promise<{ token?: string; template?: string }>
  params: Promise<{ locale: string }>
}

/**
 * Preview Page
 * 
 * Allows viewing an unpublished store using a preview token.
 * Token is validated against store_preview_tokens table.
 */
export default async function PreviewPage({ searchParams, params }: PreviewPageProps) {
  const { token, template } = await searchParams
  const { locale } = await params

  if (!token && template) {
    const selectedTemplate = getTemplateById(template) ?? generalTemplate
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
        theme_id,
        organization_id
      )
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !previewToken) {
    // Token invalid or expired
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

  // Fetch products for this store (bypassing the active status check since it's preview)
  const { data: products } = await supabase
    .from('store_products')
    .select('*')
    .eq('store_id', store.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  // Transform to Product type expected by HomePageClient
  const validGender = (g: unknown): 'men' | 'women' | 'unisex' =>
    g === 'men' || g === 'women' || g === 'unisex' ? g : 'unisex'
  const transformedProducts = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price != null ? p.price / 100 : null,
    image: p.image_url || p.images?.[0] || '/placeholder.png',
    images: p.images || [],
    category: p.category || 'Uncategorized',
    gender: validGender(p.gender),
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
  }))

  // Show preview banner and render the store
  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black py-2 px-4 text-center text-sm font-medium shadow-md">
        <span className="me-2">🔍</span>
        <span>Preview Mode</span>
        <span className="mx-2">•</span>
        <span className="font-normal">This store is not yet published. Only people with this link can view it.</span>
      </div>

      {/* Store Content with padding for banner */}
      <div className="pt-10">
        <HomePageClient products={transformedProducts} />
      </div>
    </div>
  )
}
