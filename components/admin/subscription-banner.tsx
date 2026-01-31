import Link from 'next/link'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import { createClient } from '@/lib/supabase/server'

/**
 * Subscription status banner
 * Shows important notifications about subscription status
 * Following Vercel best practices: server component, minimal JavaScript
 */
export async function SubscriptionBanner() {
  const subscriptionStatus = await getSubscriptionStatus()

  // Get store ID for plan limits check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return null

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('organization_id', org.id)
    .single()

  const planLimits = store ? await getPlanLimits(store.id) : null

  // Determine banner message and type
  let bannerType: 'info' | 'warning' | 'error' | null = null
  let message = ''
  let action: { text: string; href: string } | null = null

  // Check subscription status
  if (!subscriptionStatus?.plan) {
    bannerType = 'info'
    message = 'Start your free trial to unlock all features'
    action = { text: 'Choose a Plan', href: '/admin/settings/billing' }
  } else if (subscriptionStatus.status === 'past_due') {
    bannerType = 'error'
    message = 'Payment failed - update your payment method to continue service'
    action = { text: 'Update Payment', href: '/admin/settings/billing' }
  } else if (subscriptionStatus.status === 'canceled') {
    bannerType = 'warning'
    message = 'Your subscription has been canceled and will end soon'
    action = { text: 'Reactivate', href: '/admin/settings/billing' }
  } else if (planLimits && planLimits.productsUsed >= planLimits.productLimit * 0.9) {
    // Near product limit (>90%)
    bannerType = 'warning'
    message = `You've used ${planLimits.productsUsed}/${planLimits.productLimit} products`
    action = { text: 'Upgrade Plan', href: '/admin/settings/billing' }
  } else if (planLimits && planLimits.productsUsed >= planLimits.productLimit) {
    // At product limit
    bannerType = 'error'
    message = "You've reached your product limit"
    action = { text: 'Upgrade Now', href: '/admin/settings/billing' }
  }

  if (!bannerType) return null

  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  }

  const style = styles[bannerType]

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={style.text}>
            {style.icon}
          </div>
          <p className={`${style.text} font-medium`}>
            {message}
          </p>
        </div>

        {action && (
          <Link
            href={action.href}
            className={`${style.button} px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap`}
          >
            {action.text}
          </Link>
        )}
      </div>
    </div>
  )
}
