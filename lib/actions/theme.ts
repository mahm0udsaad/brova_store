"use server"

import { createClient } from '@/lib/supabase/server'
import { getAdminStoreContext } from '@/lib/supabase/queries/admin-store'
import { getThemeById } from '@/lib/themes'

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

export type ThemeConfig = {
  branding?: BrandingConfig
  colors?: ColorConfig
  hero?: HeroConfig
  layout?: Record<string, unknown>
  typography?: Record<string, unknown>
  footer?: Record<string, unknown>
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
