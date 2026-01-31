"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe, getPlanById } from "@/lib/stripe/client"
import { revalidatePath } from "next/cache"

export interface SubscriptionStatus {
  status: string | null
  plan: string | null
  interval: string | null
  period_end: string | null
  stripe_customer_id: string | null
}

/**
 * Create a Stripe Checkout session for subscription
 * Following Vercel best practices: server-side operation, minimal data passing
 */
export async function createSubscriptionCheckout(
  planId: string,
  interval: 'month' | 'year'
): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: "Unauthorized" }
    }

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, stripe_customer_id, name, owner_id")
      .eq("owner_id", user.id)
      .single()

    if (orgError || !org) {
      return { url: null, error: "Organization not found" }
    }

    // Get plan details from database
    const plan = await getPlanById(planId)
    if (!plan) {
      return { url: null, error: "Invalid plan" }
    }

    // Get correct price ID based on interval
    const priceId = interval === 'month' ? plan.monthly_price_id : plan.yearly_price_id

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: org.id,
          user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/billing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        organization_id: org.id,
        plan_id: planId,
      },
    })

    return { url: session.url }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return { url: null, error: "Failed to create checkout session" }
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createCustomerPortalSession(): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: "Unauthorized" }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.stripe_customer_id) {
      return { url: null, error: "No subscription found" }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/billing`,
    })

    return { url: session.url }
  } catch (error) {
    console.error("Error creating portal session:", error)
    return { url: null, error: "Failed to create portal session" }
  }
}

/**
 * Get current subscription status
 * Following Vercel best practices: minimal data serialization
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id, subscription_status, subscription_plan, subscription_interval, subscription_period_end")
      .eq("owner_id", user.id)
      .single()

    if (!org) return null

    return {
      status: org.subscription_status,
      plan: org.subscription_plan,
      interval: org.subscription_interval,
      period_end: org.subscription_period_end,
      stripe_customer_id: org.stripe_customer_id,
    }
  } catch (error) {
    console.error("Error getting subscription status:", error)
    return null
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.subscription_id) {
      return { success: false, error: "No active subscription" }
    }

    // Cancel at period end (don't immediately cancel)
    await stripe.subscriptions.update(org.subscription_id, {
      cancel_at_period_end: true,
    })

    revalidatePath("/admin/settings/billing")

    return { success: true }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return { success: false, error: "Failed to cancel subscription" }
  }
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.subscription_id) {
      return { success: false, error: "No subscription found" }
    }

    // Resume subscription
    await stripe.subscriptions.update(org.subscription_id, {
      cancel_at_period_end: false,
    })

    revalidatePath("/admin/settings/billing")

    return { success: true }
  } catch (error) {
    console.error("Error resuming subscription:", error)
    return { success: false, error: "Failed to resume subscription" }
  }
}
