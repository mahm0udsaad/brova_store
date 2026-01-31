"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { revalidatePath } from "next/cache"

export interface ConnectAccountStatus {
  connected: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  stripe_account_id: string | null
}

/**
 * Create a Stripe Connect Express account for merchant
 * Following Vercel best practices: server-side operation
 */
export async function createConnectAccount(): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: "Unauthorized" }
    }

    // Get organization and store
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", user.id)
      .single()

    if (!org) {
      return { url: null, error: "Organization not found" }
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", org.id)
      .single()

    if (!store) {
      return { url: null, error: "Store not found" }
    }

    // Check if already has a Connect account
    const { data: wallet } = await supabase
      .from("wallet_balances")
      .select("stripe_account_id")
      .eq("store_id", store.id)
      .single()

    if (wallet?.stripe_account_id) {
      // Account already exists, create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: wallet.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet?connect=success`,
        type: 'account_onboarding',
      })

      return { url: accountLink.url }
    }

    // Create new Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        organization_id: org.id,
        store_id: store.id,
        user_id: user.id,
      },
    })

    // Save account ID to wallet_balances
    const { error: updateError } = await supabase
      .from("wallet_balances")
      .upsert({
        store_id: store.id,
        stripe_account_id: account.id,
        stripe_connected: false,
      })

    if (updateError) {
      console.error("Error saving Connect account:", updateError)
      return { url: null, error: "Failed to save account" }
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet?connect=success`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (error) {
    console.error("Error creating Connect account:", error)
    return { url: null, error: "Failed to create Connect account" }
  }
}

/**
 * Get Connect account status
 */
export async function getConnectAccountStatus(): Promise<ConnectAccountStatus | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org) return null

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", org.id)
      .single()

    if (!store) return null

    const { data: wallet } = await supabase
      .from("wallet_balances")
      .select("stripe_account_id, stripe_connected")
      .eq("store_id", store.id)
      .single()

    if (!wallet?.stripe_account_id) {
      return {
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        stripe_account_id: null,
      }
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(wallet.stripe_account_id)

    return {
      connected: wallet.stripe_connected || false,
      charges_enabled: account.charges_enabled || false,
      payouts_enabled: account.payouts_enabled || false,
      details_submitted: account.details_submitted || false,
      stripe_account_id: wallet.stripe_account_id,
    }
  } catch (error) {
    console.error("Error getting Connect account status:", error)
    return null
  }
}

/**
 * Create a login link to Stripe Express dashboard
 */
export async function createConnectDashboardLink(): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: "Unauthorized" }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org) {
      return { url: null, error: "Organization not found" }
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", org.id)
      .single()

    if (!store) {
      return { url: null, error: "Store not found" }
    }

    const { data: wallet } = await supabase
      .from("wallet_balances")
      .select("stripe_account_id")
      .eq("store_id", store.id)
      .single()

    if (!wallet?.stripe_account_id) {
      return { url: null, error: "No Connect account found" }
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(wallet.stripe_account_id)

    return { url: loginLink.url }
  } catch (error) {
    console.error("Error creating dashboard link:", error)
    return { url: null, error: "Failed to create dashboard link" }
  }
}

/**
 * Refresh Connect account onboarding link
 */
export async function refreshConnectOnboarding(): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: "Unauthorized" }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org) {
      return { url: null, error: "Organization not found" }
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", org.id)
      .single()

    if (!store) {
      return { url: null, error: "Store not found" }
    }

    const { data: wallet } = await supabase
      .from("wallet_balances")
      .select("stripe_account_id")
      .eq("store_id", store.id)
      .single()

    if (!wallet?.stripe_account_id) {
      return { url: null, error: "No Connect account found" }
    }

    const accountLink = await stripe.accountLinks.create({
      account: wallet.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/wallet?connect=success`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (error) {
    console.error("Error refreshing onboarding:", error)
    return { url: null, error: "Failed to refresh onboarding" }
  }
}
