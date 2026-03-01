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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background elements matching landing page */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>
      
      <SignupForm locale={locale} />
    </div>
  )
}
