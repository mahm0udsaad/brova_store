/**
 * Order Confirmation Page
 *
 * Displays a success message after a successful order placement.
 * Server component that loads store context for themed rendering.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  getStorefrontContext,
  getStorefrontSettings,
} from '@/lib/supabase/queries/storefront'
import { resolveSkin } from '@/components/storefront/skins'
import { resolveTenant } from '@/lib/tenant-resolver'
import type { Locale } from '@/i18n'
import type { ThemeSettings } from '@/types/theme'
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

interface OrderConfirmedPageProps {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ id?: string }>
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

export default async function OrderConfirmedPage(props: OrderConfirmedPageProps) {
  const { locale } = await props.params
  const { id: orderId } = await props.searchParams
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
  const isRtl = locale === 'ar'
  const SkinHeader = skinRegistry.StoreHeader
  const SkinFooter = skinRegistry.StoreFooter

  const BackArrow = isRtl ? ArrowRight : ArrowLeft

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
      <SkinHeader
        config={{ logoText: context.store.name, sticky: true }}
        locale={locale}
        theme={theme}
      />

      <section
        className="flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="mx-auto max-w-md space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {isRtl ? 'تم تأكيد طلبك!' : 'Order Confirmed!'}
          </h1>

          {/* Message */}
          <p className="text-sm text-neutral-500 leading-relaxed">
            {isRtl
              ? 'شكرا لطلبك. سيتم التواصل معك لتأكيد التوصيل. الدفع عند الاستلام.'
              : 'Thank you for your order. We will contact you to confirm delivery. Payment on delivery.'}
          </p>

          {/* Order ID */}
          {orderId && (
            <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
              <p className="text-xs text-neutral-500 mb-1">
                {isRtl ? 'رقم الطلب' : 'Order ID'}
              </p>
              <p className="text-sm font-mono font-semibold text-neutral-900">
                {orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* COD badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <span>
              {isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
            </span>
          </div>

          {/* Back to store */}
          <div className="pt-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <BackArrow className="size-4" />
              {isRtl ? 'العودة للمتجر' : 'Back to Store'}
            </Link>
          </div>
        </div>
      </section>

      <SkinFooter
        config={{ storeName: context.store.name }}
        locale={locale}
        theme={theme}
      />
    </div>
  )
}

export async function generateMetadata(props: OrderConfirmedPageProps) {
  const { locale } = await props.params
  return {
    title: locale === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed',
  }
}
