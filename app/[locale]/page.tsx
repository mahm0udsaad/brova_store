/**
 * Root Storefront Page
 *
 * Shows landing page for unauthenticated users on default tenant (brova)
 * Shows storefront for all other tenants and authenticated users
 */

import { StorefrontHome } from './storefront-home'
import LandingPageClient from './landing-page-client'
import type { Locale } from '@/i18n'
import { resolveTenant } from '@/lib/tenant-resolver'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params

  // Detect tenant via domain/subdomain
  const orgSlug = await resolveTenant()

  // Show landing page if tenant is default 'brova' and user not authenticated
  // This allows www.brova.app to show marketing landing page for new users
  if (orgSlug === 'brova') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return <LandingPageClient />
    }
  }

  return <StorefrontHome locale={locale} orgSlug={orgSlug} />
}
