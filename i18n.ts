import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Supported locales
export const locales = ['en', 'ar'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale configuration
export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = (await requestLocale) ?? defaultLocale

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(resolvedLocale as Locale)) notFound()

  return {
    locale: resolvedLocale,
    messages: (await import(`./lib/i18n/${resolvedLocale}/index.ts`)).default,
  }
})
