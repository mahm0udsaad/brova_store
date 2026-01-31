import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const { locale } = await params

  if (code) {
    const supabase = await createClient()
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/${locale}/auth-error`)
    }
  }

  // Redirect to start page after successful auth
  return NextResponse.redirect(`${requestUrl.origin}/${locale}/start`)
}
