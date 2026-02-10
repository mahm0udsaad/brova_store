import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// i18n middleware instance
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Paths that skip processing
const PUBLIC_FILE = /\.(.*)$/
const isApiRoute = (pathname: string) => pathname.startsWith('/api')
const isNextInternal = (pathname: string) => pathname.startsWith('/_next')

// Admin paths that require authentication
const ADMIN_PATH_PREFIX = '/admin'
const ADMIN_API_PREFIX = '/api/admin'
const ADMIN_LOGIN_PATHS = ['/admin-login', '/login']

function isAdminPath(pathname: string): boolean {
  const strippedPath = pathname.replace(/^\/(en|ar)/, '')
  if (ADMIN_LOGIN_PATHS.some(p => strippedPath === p || strippedPath.startsWith(p + '/'))) {
    return false
  }
  return strippedPath.startsWith(ADMIN_PATH_PREFIX)
}

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith(ADMIN_API_PREFIX)
}

// AI/Voice API paths that also require authentication
const PROTECTED_API_PREFIXES = ['/api/ai/', '/api/voice/']

function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(p => pathname.startsWith(p))
}

function resolveTenantFromHost(host: string): string | null {
  const hostname = host.split(':')[0]

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'brova'
  }

  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      return parts[0] === 'www' && parts.length > 2 ? parts[1] : parts[0]
    }
  }

  const isBrovaSubdomain = hostname.includes('brova.app') || hostname.includes('vercel.app')
  if (isBrovaSubdomain) {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      if (parts[0] === 'www' && parts.length > 3) return parts[1]
      if (parts[0] !== 'www') return parts[0]
    }
  }

  return null
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Skip static files and Next.js internals
  if (isNextInternal(pathname) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  // --- Tenant Resolution ---
  const tenantSlug = resolveTenantFromHost(host)

  // --- I18n / Response ---
  let response: NextResponse

  if (isApiRoute(pathname)) {
    response = NextResponse.next()
  } else {
    response = intlMiddleware(request)
  }

  // Set tenant header
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug)
  }

  // --- Supabase Auth Session Refresh ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // --- API Route Protection ---
  if (isAdminApiPath(pathname) || isProtectedApiPath(pathname)) {
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  if (isAdminPath(pathname)) {
    if (!user) {
      const locale = pathname.match(/^\/(en|ar)/)?.[1] || defaultLocale
      const loginUrl = new URL(`/${locale}/admin-login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
