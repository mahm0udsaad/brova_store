import Stripe from 'stripe'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

// Initialize Stripe client (singleton)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

// Types
export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  monthly_price_usd: number
  yearly_price_usd: number
  monthly_price_id: string
  yearly_price_id: string
  max_products: number | null
  max_ai_generations: number | null
  transaction_fee_percent: string
  features: Record<string, boolean>
  is_active: boolean
}

// Cache plan lookup for the duration of the request
export const getSubscriptionPlans = cache(async (): Promise<SubscriptionPlan[]> => {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price_usd', { ascending: true })

  if (error) {
    console.error('Error fetching subscription plans:', error)
    return []
  }

  return plans || []
})

// Get plan ID from Stripe price ID
export const getPlanFromPriceId = cache(async (priceId: string): Promise<string | null> => {
  const plans = await getSubscriptionPlans()

  for (const plan of plans) {
    if (plan.monthly_price_id === priceId || plan.yearly_price_id === priceId) {
      return plan.id
    }
  }

  return null
})

// Get plan details by ID
export const getPlanById = cache(async (planId: string): Promise<SubscriptionPlan | null> => {
  const plans = await getSubscriptionPlans()
  return plans.find(plan => plan.id === planId) || null
})

// Get interval from price ID
export const getIntervalFromPriceId = cache(async (priceId: string): Promise<'month' | 'year' | null> => {
  const plans = await getSubscriptionPlans()

  for (const plan of plans) {
    if (plan.monthly_price_id === priceId) return 'month'
    if (plan.yearly_price_id === priceId) return 'year'
  }

  return null
})
