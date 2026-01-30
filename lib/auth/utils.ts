import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication - redirects to login if not authenticated
 * @param locale - Current locale for redirect
 */
export async function requireAuth(locale: string) {
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }
  return user
}

/**
 * Require guest (not authenticated) - redirects to start if authenticated
 * @param locale - Current locale for redirect
 */
export async function requireGuest(locale: string) {
  const user = await getCurrentUser()
  if (user) {
    redirect(`/${locale}/start`)
  }
}

/**
 * Get user's profile from database
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}
