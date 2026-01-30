import { requireAuth } from '@/lib/auth/utils'
import StoreTypeForm from './store-type-form'

export default async function StoreTypePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAuth(locale)

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4"
    >
      <StoreTypeForm locale={locale} />
    </div>
  )
}
