'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en'

    // Replace the locale in the current pathname
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')

    // Use window.location for full page refresh to ensure proper RTL/LTR and content update
    window.location.href = newPath
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="gap-2"
      aria-label={t('switchLanguage', { language: locale === 'en' ? t('arabic') : t('english') })}
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">
        {locale === 'en' ? 'ع' : 'EN'}
      </span>
    </Button>
  )
}
