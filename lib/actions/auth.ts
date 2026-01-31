'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export type AuthResult = {
  success: boolean
  error?: string
  errorCode?: string
}

export async function signUp(
  locale: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Don't require email confirmation - auto-confirm on signup
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      console.error('Signup error:', error)

      // Map Supabase errors to user-friendly messages
      if (error.message.includes('already registered')) {
        return { success: false, errorCode: 'emailExists' }
      }
      if (error.message.includes('password')) {
        return { success: false, errorCode: 'weakPassword' }
      }
      if (error.message.includes('email_not_confirmed')) {
        return { success: false, errorCode: 'emailNotConfirmed' }
      }

      return { success: false, errorCode: 'generic' }
    }

    if (!data.user) {
      return { success: false, errorCode: 'generic' }
    }

    // Store locale preference in cookie
    const cookieStore = await cookies()
    cookieStore.set('preferred-locale', locale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax',
    })

    return { success: true }
  } catch (error) {
    console.error('Unexpected signup error:', error)
    return { success: false, errorCode: 'generic' }
  }
}

export async function logIn(
  locale: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)

      // Map Supabase errors to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, errorCode: 'invalidCredentials' }
      }
      if (error.message.includes('too many requests')) {
        return { success: false, errorCode: 'tooManyAttempts' }
      }
      if (error.message.includes('email_not_confirmed')) {
        return { success: false, errorCode: 'emailNotConfirmed' }
      }

      return { success: false, errorCode: 'generic' }
    }

    // Store locale preference in cookie
    const cookieStore = await cookies()
    cookieStore.set('preferred-locale', locale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax',
    })

    return { success: true }
  } catch (error) {
    console.error('Unexpected login error:', error)
    return { success: false, errorCode: 'generic' }
  }
}

export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle(
  locale: string,
): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  try {
    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/${locale}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google sign-in error:', error)
      return { success: false, error: error.message }
    }

    if (!data.url) {
      return { success: false, error: 'No redirect URL provided' }
    }

    return { success: true, redirectUrl: data.url }
  } catch (error) {
    console.error('Unexpected Google sign-in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
