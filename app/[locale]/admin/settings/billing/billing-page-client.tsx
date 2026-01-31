'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionPlan } from '@/lib/stripe/client'
import type { SubscriptionStatus } from '@/lib/actions/subscription'
import {
  createSubscriptionCheckout,
  createCustomerPortalSession,
  cancelSubscription,
  resumeSubscription,
} from '@/lib/actions/subscription'

interface BillingPageClientProps {
  subscriptionStatus: SubscriptionStatus | null
  plans: SubscriptionPlan[]
}

/**
 * Billing page client component
 * Following Vercel best practices:
 * - useTransition for non-urgent updates
 * - Server actions for mutations
 * - Optimistic UI updates where appropriate
 */
export function BillingPageClient({ subscriptionStatus, plans }: BillingPageClientProps) {
  const router = useRouter()
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    setLoading(planId)
    try {
      const result = await createSubscriptionCheckout(planId, interval)
      if (result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to create checkout session')
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoading('portal')
    try {
      const result = await createCustomerPortalSession()
      if (result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the current billing period.')) {
      return
    }

    setLoading('cancel')
    try {
      const result = await cancelSubscription()
      if (result.success) {
        startTransition(() => {
          router.refresh()
        })
        alert('Subscription canceled. Access will continue until the end of your billing period.')
      } else {
        alert(result.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setLoading(null)
    }
  }

  const handleResumeSubscription = async () => {
    setLoading('resume')
    try {
      const result = await resumeSubscription()
      if (result.success) {
        startTransition(() => {
          router.refresh()
        })
        alert('Subscription resumed successfully!')
      } else {
        alert(result.error || 'Failed to resume subscription')
      }
    } catch (error) {
      console.error('Error resuming subscription:', error)
      alert('Failed to resume subscription')
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm font-medium">Active</span>
      case 'past_due':
        return <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-full text-sm font-medium">Past Due</span>
      case 'canceled':
        return <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full text-sm font-medium">Canceled</span>
      case 'trialing':
        return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium">Trial</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full text-sm font-medium">No Subscription</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      {subscriptionStatus?.plan && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Current Subscription
              </h2>
              <div className="flex items-center gap-3">
                {getStatusBadge(subscriptionStatus.status)}
                <span className="text-gray-600 dark:text-gray-400">
                  {plans.find(p => p.id === subscriptionStatus.plan)?.name || subscriptionStatus.plan}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Renewal Date
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(subscriptionStatus.period_end)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleManageSubscription}
              disabled={loading === 'portal'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
            </button>

            {subscriptionStatus.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading === 'cancel'}
                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}

            {subscriptionStatus.status === 'canceled' && (
              <button
                onClick={handleResumeSubscription}
                disabled={loading === 'resume'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === 'resume' ? 'Resuming...' : 'Resume Subscription'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-lg font-medium transition-colors ${interval === 'month' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          Monthly
        </span>

        <button
          onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
          className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          role="switch"
          aria-checked={interval === 'year'}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              interval === 'year' ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-lg font-medium transition-colors ${interval === 'year' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Yearly
          </span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm font-semibold rounded-full">
            Save 20%
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => {
          const isCurrentPlan = plan.id === subscriptionStatus?.plan
          const price = interval === 'month' ? plan.monthly_price_usd : plan.yearly_price_usd

          return (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                plan.id === 'pro' ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.id === 'pro' && (
                <div className="mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>

              {plan.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {plan.description}
                </p>
              )}

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${(price / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{interval === 'month' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>

              {isCurrentPlan ? (
                <div className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-center font-medium">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading === plan.id ? 'Loading...' : subscriptionStatus?.plan ? 'Switch Plan' : 'Get Started'}
                </button>
              )}

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {plan.max_products == null ? 'Unlimited' : plan.max_products} Products
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {plan.max_ai_generations == null ? 'Unlimited' : plan.max_ai_generations} AI Gens
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {(parseFloat(plan.transaction_fee_percent) * 100).toFixed(0)}% Fee
                </li>
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
