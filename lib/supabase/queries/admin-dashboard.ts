/**
 * Admin Dashboard Stats Query
 *
 * Aggregated stats for admin dashboard, scoped to the authenticated user's store.
 */

import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "./admin-store"

export interface DashboardStats {
  orders: {
    total: number
    pending: number
    completed: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  products: {
    total: number
    active: number
    draft: number
    lowStock: number
  }
  customers: {
    total: number
    newThisMonth: number
  }
  revenue: {
    total: number
    thisMonth: number
    thisWeek: number
    today: number
  }
  wallet: {
    available: number
    pending: number
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const context = await getAdminStoreContext()

  if (!context) {
    return getEmptyStats()
  }

  const storeId = context.store.id
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Core queries — orders and products (these tables always exist)
  const [
    ordersTotal,
    ordersPending,
    ordersCompleted,
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    productsTotal,
    productsActive,
    productsDraft,
    productsLowStock,
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'delivered'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).gte('created_at', startOfDay.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).gte('created_at', startOfWeek.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).gte('created_at', startOfMonth.toISOString()),
    supabase.from('store_products').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('store_products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'active'),
    supabase.from('store_products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'draft'),
    supabase.from('store_products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).lte('inventory', 5),
  ])

  // Optional queries — these tables may not exist yet; fail gracefully
  const customersTotal = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('store_id', storeId).then(r => r, () => ({ count: null } as any))
  const customersNew = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('store_id', storeId).gte('created_at', startOfMonth.toISOString()).then(r => r, () => ({ count: null } as any))
  const wallet = await supabase.from('wallet_balances').select('available_balance, pending_balance').eq('store_id', storeId).single().then(r => r, () => ({ data: null } as any))

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('store_id', storeId)
    .in('status', ['delivered', 'completed'])

  const revenue = {
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
  }

  revenueData?.forEach((order: { total: number | string | null; created_at: string }) => {
    const orderTotal = typeof order.total === 'string' ? Number(order.total) : (order.total || 0)
    const orderDate = new Date(order.created_at)
    revenue.total += orderTotal
    if (orderDate >= startOfMonth) revenue.thisMonth += orderTotal
    if (orderDate >= startOfWeek) revenue.thisWeek += orderTotal
    if (orderDate >= startOfDay) revenue.today += orderTotal
  })

  return {
    orders: {
      total: ordersTotal.count || 0,
      pending: ordersPending.count || 0,
      completed: ordersCompleted.count || 0,
      today: ordersToday.count || 0,
      thisWeek: ordersThisWeek.count || 0,
      thisMonth: ordersThisMonth.count || 0,
    },
    products: {
      total: productsTotal.count || 0,
      active: productsActive.count || 0,
      draft: productsDraft.count || 0,
      lowStock: productsLowStock.count || 0,
    },
    customers: {
      total: customersTotal.count || 0,
      newThisMonth: customersNew.count || 0,
    },
    revenue,
    wallet: {
      available: wallet.data?.available_balance || 0,
      pending: wallet.data?.pending_balance || 0,
    },
  }
}

function getEmptyStats(): DashboardStats {
  return {
    orders: { total: 0, pending: 0, completed: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    products: { total: 0, active: 0, draft: 0, lowStock: 0 },
    customers: { total: 0, newThisMonth: 0 },
    revenue: { total: 0, thisMonth: 0, thisWeek: 0, today: 0 },
    wallet: { available: 0, pending: 0 },
  }
}
