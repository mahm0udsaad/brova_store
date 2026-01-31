import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getPlanFromPriceId, getIntervalFromPriceId } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Stripe Webhook Handler
 *
 * CRITICAL: This uses Supabase admin client to bypass RLS
 * Handles snapshot payload style from Stripe
 * Following Vercel best practices: quick 200 response, async processing
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Received webhook: ${event.type}`)

    // Handle the event (snapshot payload style - full data in event.data.object)
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object as Stripe.Charge)
          break

        case 'charge.dispute.created':
          await handleDisputeCreated(event.data.object as Stripe.Dispute)
          break

        case 'account.updated':
          await handleAccountUpdated(event.data.object as Stripe.Account)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (handlerError: any) {
      // Log error but return 200 to prevent retries on bad data
      console.error(`Error handling ${event.type}:`, handlerError.message)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/**
 * Handle checkout.session.completed
 * For both subscription and payment modes
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()

  if (session.mode === 'subscription') {
    // Subscription checkout completed
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = subscription.items.data[0].price.id

    // Get plan from price ID
    const planId = await getPlanFromPriceId(priceId)
    const interval = await getIntervalFromPriceId(priceId)

    // Update organization
    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_customer_id: customerId,
        subscription_id: subscriptionId,
        subscription_status: subscription.status,
        subscription_plan: planId,
        subscription_interval: interval,
        subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Error updating organization subscription:', error)
    }
  } else if (session.mode === 'payment') {
    // Store purchase completed
    const storeId = session.metadata?.store_id
    const organizationId = session.metadata?.organization_id

    if (!storeId) {
      console.error('No store_id in checkout session metadata')
      return
    }

    // Get payment intent to calculate amounts
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
    const totalAmount = paymentIntent.amount
    const applicationFee = paymentIntent.application_fee_amount || 0
    const merchantAmount = totalAmount - applicationFee

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_email: session.customer_email,
        total_amount: totalAmount,
        status: 'paid',
        payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .rpc('increment_wallet_balance', {
        p_store_id: storeId,
        p_amount: merchantAmount,
      })

    if (walletError) {
      console.error('Error updating wallet balance:', walletError)
    }

    // Create wallet transaction record
    await supabase
      .from('wallet_transactions')
      .insert({
        store_id: storeId,
        amount: merchantAmount,
        type: 'sale',
        description: `Order ${order.id}`,
        reference_id: order.id,
      })

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        organization_id: organizationId,
        type: 'order',
        title: 'New Order Received',
        message: `You received a new order for $${(totalAmount / 100).toFixed(2)}`,
        priority: 'medium',
      })
  }
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()

  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0].price.id

  const planId = await getPlanFromPriceId(priceId)
  const interval = await getIntervalFromPriceId(priceId)

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: planId,
      subscription_interval: interval,
      subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating organization on subscription created:', error)
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()

  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0].price.id

  const planId = await getPlanFromPriceId(priceId)
  const interval = await getIntervalFromPriceId(priceId)

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: subscription.status,
      subscription_plan: planId,
      subscription_interval: interval,
      subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating organization on subscription updated:', error)
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()

  const customerId = subscription.customer as string

  // Get organization to create notification
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('stripe_customer_id', customerId)
    .single()

  // Update organization
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      subscription_plan: null,
      subscription_interval: null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating organization on subscription deleted:', error)
  }

  // Create notification
  if (org) {
    await supabase
      .from('notifications')
      .insert({
        organization_id: org.id,
        type: 'subscription',
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. You will lose access to premium features.',
        priority: 'high',
      })
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = createAdminClient()

  const customerId = invoice.customer as string

  // Get subscription to update period end
  const inv = invoice as any
  if (inv.subscription) {
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string)

    await supabase
      .from('organizations')
      .update({
        subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        subscription_status: 'active',
      })
      .eq('stripe_customer_id', customerId)
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createAdminClient()

  const customerId = invoice.customer as string

  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('stripe_customer_id', customerId)
    .single()

  // Update status to past_due
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId)

  // Create high priority notification
  if (org) {
    await supabase
      .from('notifications')
      .insert({
        organization_id: org.id,
        type: 'payment',
        title: 'Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method to continue service.',
        priority: 'high',
      })
  }
}

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createAdminClient()

  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) return

  // Find related order
  const { data: order } = await supabase
    .from('orders')
    .select('id, store_id, total_amount')
    .eq('payment_intent_id', paymentIntentId)
    .single()

  if (!order) {
    console.error('No order found for refunded charge')
    return
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'refunded',
    })
    .eq('id', order.id)

  // Deduct from wallet balance
  await supabase
    .rpc('increment_wallet_balance', {
      p_store_id: order.store_id,
      p_amount: -order.total_amount,
    })

  // Create wallet transaction
  await supabase
    .from('wallet_transactions')
    .insert({
      store_id: order.store_id,
      amount: -order.total_amount,
      type: 'refund',
      description: `Refund for order ${order.id}`,
      reference_id: order.id,
    })
}

/**
 * Handle charge.dispute.created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const supabase = createAdminClient()

  const chargeId = dispute.charge as string

  // Get charge to find payment intent
  const charge = await stripe.charges.retrieve(chargeId)
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) return

  // Find related order
  const { data: order } = await supabase
    .from('orders')
    .select('id, store_id, stores(organization_id)')
    .eq('payment_intent_id', paymentIntentId)
    .single()

  if (!order) return

  // Create high priority notification
  await supabase
    .from('notifications')
    .insert({
      organization_id: order.stores.organization_id,
      type: 'dispute',
      title: 'Payment Dispute',
      message: `A payment dispute has been filed for order ${order.id}. Reason: ${dispute.reason}`,
      priority: 'high',
    })
}

/**
 * Handle account.updated (for Stripe Connect)
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createAdminClient()

  // Update wallet_balances with Connect account status
  const { error } = await supabase
    .from('wallet_balances')
    .update({
      stripe_connected: account.charges_enabled && account.payouts_enabled,
    })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Error updating Connect account status:', error)
  }
}
