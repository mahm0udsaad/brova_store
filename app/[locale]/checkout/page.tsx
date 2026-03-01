/**
 * Checkout Page
 *
 * Server component shell that loads store context and theme,
 * renders the client CheckoutForm with COD support.
 */

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  getStorefrontContext,
  getStorefrontSettings,
} from '@/lib/supabase/queries/storefront'
import { resolveSkin } from '@/components/storefront/skins'
import { resolveTenant } from '@/lib/tenant-resolver'
import { StorefrontShell } from '@/components/storefront/cart/storefront-shell'
import { CheckoutForm } from './checkout-form'
import type { Locale } from '@/i18n'
import type { ThemeSettings } from '@/types/theme'

interface CheckoutPageProps {
  params: Promise<{ locale: Locale }>
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

export default async function CheckoutPage(props: CheckoutPageProps) {
  const { locale } = await props.params
  const orgSlug = await resolveTenant()
  const context = await getStorefrontContext(orgSlug)

  if (!context || context.store.status !== 'active') {
    return notFound()
  }

  const [settings, skinRegistry] = await Promise.all([
    getStorefrontSettings(context.store.id),
    resolveSkin(context.store.skin_id),
  ])

  const theme = buildThemeSettings(settings)
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
        <SkinHeader
          config={{ logoText: context.store.name, sticky: true }}
          locale={locale}
          theme={theme}
        />

        <CheckoutForm locale={locale} storeName={context.store.name} />

        <SkinFooter
          config={{ storeName: context.store.name }}
          locale={locale}
          theme={theme}
        />
      </div>
    </StorefrontShell>
  )
}

export async function generateMetadata(props: CheckoutPageProps) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: 'checkoutPage' })

  return {
    title: t('title'),
  }
}
