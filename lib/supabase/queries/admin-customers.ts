/**
 * Admin Customer Queries
 *
 * Customer lists and stats scoped to the authenticated user's store.
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export interface Customer {
  id: string
  store_id: string
  user_id: string | null
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  total_orders: number
  total_spent: number
  accepts_marketing: boolean
  created_at: string
}

export async function getCustomers(options?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<{ customers: Customer[]; total: number }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { customers: [], total: 0 }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('store_id', context.store.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.search) {
    const escaped = options.search.replace(/%/g, '\\%')
    query = query.or(
      `email.ilike.%${escaped}%,first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[getCustomers] Error:', error)
    return { customers: [], total: 0 }
  }

  return { customers: (data || []) as Customer[], total: count || 0 }
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return null

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('store_id', context.store.id)
    .single()

  if (error) {
    console.error('[getCustomer] Error:', error)
    return null
  }

  return data as Customer
}

export async function getCustomerOrders(customerId: string) {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return []

  const customer = await getCustomer(customerId)
  if (!customer) return []

  const orFilters: string[] = []
  if (customer.user_id) orFilters.push(`user_id.eq.${customer.user_id}`)
  if (customer.phone) orFilters.push(`phone.eq.${customer.phone}`)

  if (orFilters.length === 0) return []

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', context.store.id)
    .or(orFilters.join(','))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getCustomerOrders] Error:', error)
    return []
  }

  return data || []
}

export async function getCustomerStats(): Promise<{ total: number; newThisMonth: number }> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()
  if (!context) return { total: 0, newThisMonth: 0 }

  const { count: total } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', context.store.id)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: newThisMonth } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', context.store.id)
    .gte('created_at', startOfMonth.toISOString())

  return {
    total: total || 0,
    newThisMonth: newThisMonth || 0,
  }
}
