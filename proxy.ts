import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use locale prefix in URL
  localePrefix: 'always',
})

export const config = {
  // Match all paths except Next.js internals, API routes, and static files
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
}
