"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe, getPlanById } from "@/lib/stripe/client"

export interface CheckoutItem {
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  name: string
  image_url?: string
}

/**
 * Create a Stripe Checkout session for customer store purchases
 * Following Vercel best practices: server-side operation with application fee split
 */
export async function createStoreCheckout(
  storeId: string,
  items: CheckoutItem[],
  customerEmail?: string,
  shippingAddress?: any
): Promise<{ url: string | null; error?: string; sessionId?: string }> {
  try {
    const supabase = await createClient()

    // Get store and organization details
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select(`
        id,
        name,
        slug,
        organization_id,
        organizations (
          id,
          subscription_plan,
          stripe_customer_id
        )
      `)
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return { url: null, error: "Store not found" }
    }

    // Get merchant's Stripe Connect account
    const { data: wallet } = await supabase
      .from("wallet_balances")
      .select("stripe_account_id, stripe_connected")
      .eq("store_id", storeId)
      .single()

    if (!wallet?.stripe_account_id || !wallet.stripe_connected) {
      return { url: null, error: "Store payment processing not set up" }
    }

    // Calculate total and platform fee
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Get merchant's plan to determine fee
    let feePercentage = 0.02 // Default 2% for no plan

    const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations
    if (org?.subscription_plan) {
      const plan = await getPlanById(org.subscription_plan)
      if (plan) {
        feePercentage = parseFloat(plan.transaction_fee_percent) / 100 // Convert to decimal
      }
    }

    // Calculate platform fee (in cents)
    const platformFeeAmount = Math.round(subtotal * feePercentage)

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
          metadata: {
            product_id: item.product_id,
            variant_id: item.variant_id || '',
          },
        },
        unit_amount: item.price, // Already in cents
      },
      quantity: item.quantity,
    }))

    // Create Checkout Session with Connect
    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${store.slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${store.slug}/checkout/cancel`,
      metadata: {
        store_id: storeId,
        organization_id: store.organization_id,
      },
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: wallet.stripe_account_id,
        },
        metadata: {
          store_id: storeId,
          organization_id: store.organization_id,
        },
      },
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    // Add shipping if provided
    if (shippingAddress) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return {
      url: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error("Error creating store checkout:", error)
    return { url: null, error: "Failed to create checkout session" }
  }
}

/**
 * Get checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    })

    return {
      session,
      error: null,
    }
  } catch (error) {
    console.error("Error retrieving checkout session:", error)
    return {
      session: null,
      error: "Failed to retrieve session",
    }
  }
}

/**
 * Create a simple payment link for a product
 * Useful for quick sharing
 */
export async function createProductPaymentLink(
  storeId: string,
  productId: string,
  variantId?: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    // Get product details
    const { data: product } = await supabase
      .from("products")
      .select(`
        id,
        name,
        base_price,
        images,
        variants
      `)
      .eq("id", productId)
      .single()

    if (!product) {
      return { url: null, error: "Product not found" }
    }

    // Determine price based on variant or base price
    let price = product.base_price
    let variantName = ''

    if (variantId && product.variants) {
      const variant = product.variants.find((v: any) => v.id === variantId)
      if (variant) {
        price = variant.price
        variantName = variant.name
      }
    }

    // Create checkout with single item
    return await createStoreCheckout(
      storeId,
      [{
        product_id: productId,
        variant_id: variantId,
        quantity: 1,
        price: price,
        name: variantName ? `${product.name} - ${variantName}` : product.name,
        image_url: product.images?.[0],
      }]
    )
  } catch (error) {
    console.error("Error creating payment link:", error)
    return { url: null, error: "Failed to create payment link" }
  }
}
