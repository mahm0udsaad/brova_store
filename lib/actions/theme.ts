"use server"

import { createClient } from '@/lib/supabase/server'
import { getAdminStoreContext } from '@/lib/supabase/queries/admin-store'
import { getThemeById } from '@/lib/themes'
import type { ComponentNode, ComponentType } from '@/types/theme'

export type UpdateStoreThemeResult =
  | { success: true; themeId: string }
  | { success: false; error: string }

export async function updateStoreTheme(themeId: string): Promise<UpdateStoreThemeResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const context = await getAdminStoreContext()
  if (!context) {
    return { success: false, error: 'No store found' }
  }

  const theme = getThemeById(themeId)
  if (!theme) {
    return { success: false, error: 'Theme not found' }
  }

  if (!theme.config.supportedStoreTypes.includes(context.store.type)) {
    return { success: false, error: 'Theme not supported for this store type' }
  }

  const { error } = await supabase
    .from('stores')
    .update({ theme_id: themeId })
    .eq('id', context.store.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, themeId }
}

// =============================================================================
// Theme Config Types
// =============================================================================

export type BrandingConfig = {
  logo_url?: string | null
  favicon_url?: string | null
  store_name?: string | null
  tagline?: string | null
  tagline_ar?: string | null
}

export type ColorConfig = {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  text?: string
}

export type HeroConfig = {
  enabled?: boolean
  image_url?: string | null
  title?: string | null
  title_ar?: string | null
  subtitle?: string | null
  subtitle_ar?: string | null
  cta_text?: string | null
  cta_text_ar?: string | null
  cta_link?: string | null
}

export type LayoutConfig = {
  products_per_row?: 3 | 4 | 5
  show_categories?: boolean
  show_featured?: boolean
  show_new_arrivals?: boolean
  header_style?: "transparent" | "solid" | "sticky"
}

export type FooterConfig = {
  about_text?: string
  about_text_ar?: string
  social_links?: {
    instagram?: string
    facebook?: string
    twitter?: string
    whatsapp?: string
    tiktok?: string
  }
}

export type ThemeConfig = {
  branding?: BrandingConfig
  colors?: ColorConfig
  hero?: HeroConfig
  layout?: LayoutConfig
  typography?: Record<string, unknown>
  footer?: FooterConfig
}

type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string }

// =============================================================================
// Theme Config Actions
// =============================================================================

export async function getThemeConfig(): Promise<ThemeConfig | null> {
  const context = await getAdminStoreContext()
  if (!context) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('store_settings')
    .select('theme_config')
    .eq('store_id', context.store.id)
    .single()

  return (data?.theme_config as ThemeConfig) ?? null
}

export async function updateThemeConfig(updates: Partial<ThemeConfig>): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()

  // Get current config
  const { data: current } = await supabase
    .from('store_settings')
    .select('theme_config')
    .eq('store_id', context.store.id)
    .single()

  const currentConfig = (current?.theme_config as ThemeConfig) ?? {}

  // Deep merge updates into current config
  const merged: ThemeConfig = {
    ...currentConfig,
    ...updates,
    branding: { ...currentConfig.branding, ...updates.branding },
    colors: { ...currentConfig.colors, ...updates.colors },
    hero: { ...currentConfig.hero, ...updates.hero },
    layout: { ...currentConfig.layout, ...updates.layout },
    typography: { ...currentConfig.typography, ...updates.typography },
    footer: { ...currentConfig.footer, ...updates.footer },
  }

  const { error } = await supabase
    .from('store_settings')
    .update({ theme_config: merged })
    .eq('store_id', context.store.id)

  if (error) {
    // If no row exists, insert one
    if (error.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('store_settings')
        .insert({ store_id: context.store.id, theme_config: merged })
      if (insertError) return { success: false, error: insertError.message }
      return { success: true }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateBranding(branding: BrandingConfig): Promise<ActionResult> {
  return updateThemeConfig({ branding })
}

export async function updateColors(colors: ColorConfig): Promise<ActionResult> {
  return updateThemeConfig({ colors })
}

export async function updateHero(hero: HeroConfig): Promise<ActionResult> {
  return updateThemeConfig({ hero })
}

// =============================================================================
// Banner CRUD
// =============================================================================

export type BannerInput = {
  image_url: string
  title?: string | null
  title_ar?: string | null
  link_url?: string | null
  link_type?: 'none' | 'product' | 'category' | 'external'
  link_target?: string | null
  position?: 'hero' | 'top' | 'middle' | 'bottom'
  sort_order?: number
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

export async function createBanner(banner: BannerInput): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_banners')
    .insert({ store_id: context.store.id, ...banner })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateBanner(bannerId: string, updates: Partial<BannerInput>): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('store_banners')
    .update(updates)
    .eq('id', bannerId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteBanner(bannerId: string): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('store_banners')
    .delete()
    .eq('id', bannerId)
    .eq('store_id', context.store.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function reorderBanners(bannerIds: string[]): Promise<ActionResult> {
  const context = await getAdminStoreContext()
  if (!context) return { success: false, error: 'No store found' }

  const supabase = await createClient()

  const results = await Promise.all(
    bannerIds.map((id, i) =>
      supabase
        .from('store_banners')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('store_id', context.store.id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  return { success: true }
}

export async function getBanners(): Promise<BannerInput & { id: string }[] | null> {
  const context = await getAdminStoreContext()
  if (!context) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('store_banners')
    .select('*')
    .eq('store_id', context.store.id)
    .order('sort_order', { ascending: true })

  return data as any
}

// =============================================================================
// Component Tree Operations (store_components table)
// =============================================================================

export async function getComponentTree(storeId?: string): Promise<ComponentNode[]> {
  const context = await getAdminStoreContext()
  const resolvedStoreId = storeId || context?.store.id
  if (!resolvedStoreId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_components')
    .select('*')
    .eq('store_id', resolvedStoreId)
    .eq('status', 'active')
    .order('position', { ascending: true })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    type: row.component_type as ComponentType,
    config: (row.config as Record<string, unknown>) ?? {},
    children: [],
    order: row.position,
    visible: row.status === 'active',
  }))
}

export async function saveComponentTree(
  storeId: string,
  nodes: ComponentNode[]
): Promise<ActionResult> {
  const supabase = await createClient()

  // Delete existing components for this store
  const { error: deleteError } = await supabase
    .from('store_components')
    .delete()
    .eq('store_id', storeId)

  if (deleteError) return { success: false, error: deleteError.message }

  if (nodes.length === 0) return { success: true }

  // Insert all nodes
  const rows = nodes.map((node, i) => ({
    store_id: storeId,
    component_type: node.type,
    config: node.config,
    position: node.order ?? i,
    status: node.visible !== false ? 'active' : 'inactive',
  }))

  const { error: insertError } = await supabase
    .from('store_components')
    .insert(rows as any)

  if (insertError) return { success: false, error: insertError.message }
  return { success: true }
}

export async function addThemeComponent(
  storeId: string,
  type: ComponentType,
  config: Record<string, unknown> = {},
  position?: number
): Promise<ActionResult> {
  const supabase = await createClient()

  // Get max position if not specified
  if (position === undefined) {
    const { data } = await supabase
      .from('store_components')
      .select('position')
      .eq('store_id', storeId)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    position = (data?.position ?? -1) + 1
  }

  const { data, error } = await supabase
    .from('store_components')
    .insert({
      store_id: storeId,
      component_type: type,
      config,
      position,
      status: 'active',
    } as any)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function removeThemeComponent(
  storeId: string,
  componentId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('store_components')
    .delete()
    .eq('id', componentId)
    .eq('store_id', storeId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateThemeComponent(
  storeId: string,
  componentId: string,
  updates: { config?: Record<string, unknown>; visible?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (updates.config !== undefined) updateData.config = updates.config
  if (updates.visible !== undefined) updateData.status = updates.visible ? 'active' : 'inactive'
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('store_components')
    .update(updateData)
    .eq('id', componentId)
    .eq('store_id', storeId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function reorderThemeComponents(
  storeId: string,
  componentIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient()

  const results = await Promise.all(
    componentIds.map((id, i) =>
      supabase
        .from('store_components')
        .update({ position: i })
        .eq('id', id)
        .eq('store_id', storeId)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }
  return { success: true }
}

export async function applyTemplate(
  storeId: string,
  templateId: string
): Promise<ActionResult> {
  // Dynamic import to avoid circular dependency
  const { themeTemplates } = await import('@/lib/theme/templates')
  const template = themeTemplates.find((t) => t.id === templateId)
  if (!template) return { success: false, error: 'Template not found' }

  return saveComponentTree(storeId, template.nodes)
}
