/**
 * Admin Wallet Queries
 *
 * Wallets, transactions, and payouts scoped to the authenticated user's store.
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export interface StoreWallet {
  id: string
  store_id: string
  available_balance: number
  pending_balance: number
  total_earned: number
  total_withdrawn: number
  currency: string
  stripe_account_id: string | null
  stripe_account_status: string
  stripe_onboarding_complete: boolean
}

export interface WalletTransaction {
  id: string
  type: 'sale' | 'refund' | 'payout' | 'fee' | 'adjustment'
  status: 'pending' | 'completed' | 'failed'
  amount: number
  fee: number
  net_amount: number
  currency: string
  order_id: string | null
  description: string | null
  created_at: string
}

export interface Payout {
  id: string
  store_id: string
  wallet_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'
  stripe_payout_id: string | null
  requested_at: string
  processed_at: string | null
  paid_at: string | null
  failed_at: string | null
  failure_reason: string | null
  created_at: string
}

export async function getStoreWallet(): Promise<StoreWallet | null> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return null

  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('store_id', context.store.id)
    .single()

  if (error) {
    console.error('[getStoreWallet] Error:', error)
    return null
  }

  return data as StoreWallet
}

export async function getWalletTransactions(options?: {
  limit?: number
  offset?: number
  type?: string
}): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { transactions: [], total: 0 }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  let query = supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('store_id', context.store.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[getWalletTransactions] Error:', error)
    return { transactions: [], total: 0 }
  }

  return { transactions: (data || []) as WalletTransaction[], total: count || 0 }
}

export async function getPayoutHistory(options?: {
  limit?: number
  offset?: number
}): Promise<{ payouts: Payout[]; total: number }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { payouts: [], total: 0 }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  const { data, count, error } = await supabase
    .from('payouts')
    .select('*', { count: 'exact' })
    .eq('store_id', context.store.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[getPayoutHistory] Error:', error)
    return { payouts: [], total: 0 }
  }

  return { payouts: (data || []) as Payout[], total: count || 0 }
}
