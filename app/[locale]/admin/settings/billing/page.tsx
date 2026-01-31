import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionPlans } from '@/lib/stripe/client'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { BillingPageClient } from './billing-page-client'

export const metadata: Metadata = {
  title: 'Billing - Admin Dashboard',
  description: 'Manage your subscription and billing settings',
}

/**
 * Billing settings page
 * Following Vercel best practices: server component for auth and data fetching
 */
export default async function BillingPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get subscription status and plans in parallel
  const [subscriptionStatus, plans] = await Promise.all([
    getSubscriptionStatus(),
    getSubscriptionPlans(),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription plan and billing information
        </p>
      </div>

      <BillingPageClient
        subscriptionStatus={subscriptionStatus}
        plans={plans}
      />
    </div>
  )
}
