'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  createConnectAccount,
  createConnectDashboardLink,
  refreshConnectOnboarding,
  type ConnectAccountStatus,
} from '@/lib/actions/stripe-connect'

interface StripeConnectSectionProps {
  connectStatus: ConnectAccountStatus | null
}

/**
 * Stripe Connect integration section for wallet page
 * Following Vercel best practices: client component only for interactivity
 */
export function StripeConnectSection({ connectStatus }: StripeConnectSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)

  // Show success message if redirected back from Connect onboarding
  const connectSuccess = searchParams.get('connect') === 'success'

  const handleConnect = async () => {
    setLoading('connect')
    try {
      const result = await createConnectAccount()
      if (result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to create Connect account')
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      alert('Failed to connect Stripe account')
    } finally {
      setLoading(null)
    }
  }

  const handleOpenDashboard = async () => {
    setLoading('dashboard')
    try {
      const result = await createConnectDashboardLink()
      if (result.url) {
        window.open(result.url, '_blank')
      } else {
        alert(result.error || 'Failed to open Stripe dashboard')
      }
    } catch (error) {
      console.error('Error opening dashboard:', error)
      alert('Failed to open Stripe dashboard')
    } finally {
      setLoading(null)
    }
  }

  const handleCompleteSetup = async () => {
    setLoading('complete')
    try {
      const result = await refreshConnectOnboarding()
      if (result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to refresh onboarding')
      }
    } catch (error) {
      console.error('Error refreshing onboarding:', error)
      alert('Failed to refresh onboarding')
    } finally {
      setLoading(null)
    }
  }

  // Determine status and UI
  const isConnected = connectStatus?.connected && connectStatus?.charges_enabled && connectStatus?.payouts_enabled
  const isPending = connectStatus?.stripe_account_id && !isConnected
  const isNotConnected = !connectStatus?.stripe_account_id

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Processing</CardTitle>
      </CardHeader>
      <CardContent>
        {connectSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Stripe account connected successfully!
            </p>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isConnected
                ? 'bg-green-100 dark:bg-green-900/20'
                : isPending
                ? 'bg-yellow-100 dark:bg-yellow-900/20'
                : 'bg-purple-100 dark:bg-purple-900/20'
            }`}>
              {isConnected ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : isPending ? (
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isConnected
                  ? 'Stripe Connected'
                  : isPending
                  ? 'Complete Stripe Setup'
                  : 'Connect Stripe to Receive Payments'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? 'Your account is ready to receive payments'
                  : isPending
                  ? 'Finish setting up your Stripe account to receive payments'
                  : 'Set up Stripe to start accepting payments from customers'}
              </p>
              {connectStatus && !isConnected && (
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {connectStatus.charges_enabled ? '✓' : '○'} Charges
                  </span>
                  <span className="flex items-center gap-1">
                    {connectStatus.payouts_enabled ? '✓' : '○'} Payouts
                  </span>
                  <span className="flex items-center gap-1">
                    {connectStatus.details_submitted ? '✓' : '○'} Details
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleOpenDashboard}
                disabled={loading === 'dashboard'}
                className="flex items-center gap-2"
              >
                {loading === 'dashboard' ? 'Opening...' : (
                  <>
                    Open Dashboard
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : isPending ? (
              <Button
                onClick={handleCompleteSetup}
                disabled={loading === 'complete'}
              >
                {loading === 'complete' ? 'Loading...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={loading === 'connect'}
              >
                {loading === 'connect' ? 'Connecting...' : 'Connect Stripe'}
              </Button>
            )}
          </div>
        </div>

        {isNotConnected && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Why connect Stripe?</strong> Stripe allows you to securely accept payments from customers.
              You'll be able to receive payouts directly to your bank account with competitive transaction fees.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
