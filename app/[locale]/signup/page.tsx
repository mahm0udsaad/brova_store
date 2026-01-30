import { requireGuest } from '@/lib/auth/utils'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import SignupForm from './signup-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.signup' })

  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Redirect to start if already authenticated
  await requireGuest(locale)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <SignupForm locale={locale} />
    </div>
  )
}
