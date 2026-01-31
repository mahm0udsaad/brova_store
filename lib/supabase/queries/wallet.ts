/**
 * Wallet Queries
 * Query wallet_balances and wallet_transactions tables
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export async function getWalletBalance() {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return null

  const { data, error } = await supabase
    .from("wallet_balances")
    .select("*")
    .eq("store_id", context.store.id)
    .single()

  if (error) {
    console.error("[getWalletBalance] Error:", error)
    return null
  }

  return data
}

export async function getWalletTransactions(limit = 20) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return []

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("store_id", context.store.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[getWalletTransactions] Error:", error)
    return []
  }

  return data || []
}
