"use server"

import { createClient } from "@/lib/supabase/server"

// =============================================================================
// Dashboard Summary
// =============================================================================

export async function getDashboardSummary(storeId: string) {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  // Today's orders count and revenue
  const { data: todayOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total_amount")
    .eq("store_id", storeId)
    .gte("created_at", todayISO)

  if (ordersError) {
    console.error("Failed to get today's orders:", ordersError)
  }

  const todayOrderCount = todayOrders?.length ?? 0
  const todayRevenue = (todayOrders ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount ?? 0),
    0
  )

  // New customers today
  const { count: newCustomers, error: customersError } = await supabase
    .from("store_customers")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .gte("created_at", todayISO)

  if (customersError) {
    console.error("Failed to get new customers:", customersError)
  }

  // Low stock products (inventory < 5)
  const { data: lowStockProducts, error: stockError } = await supabase
    .from("store_products")
    .select("id, name, name_ar, stock_quantity")
    .eq("store_id", storeId)
    .eq("status", "active")
    .lt("stock_quantity", 5)
    .order("stock_quantity", { ascending: true })
    .limit(10)

  if (stockError) {
    console.error("Failed to get low stock products:", stockError)
  }

  return {
    todayOrderCount,
    todayRevenue,
    newCustomers: newCustomers ?? 0,
    lowStockProducts: lowStockProducts ?? [],
  }
}

// =============================================================================
// Recent Orders
// =============================================================================

export async function getRecentOrders(storeId: string, limit = 5) {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, currency, created_at, customer_name, customer_email")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Failed to get recent orders:", error)
    return []
  }

  return orders ?? []
}

// =============================================================================
// Quick Create Product
// =============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .concat("-", Date.now().toString(36))
}

export async function quickCreateProduct(
  storeId: string,
  data: { name: string; price: number; description?: string }
) {
  const supabase = await createClient()

  const slug = generateSlug(data.name)

  const { data: product, error } = await supabase
    .from("store_products")
    .insert({
      store_id: storeId,
      name: data.name,
      slug,
      price: data.price,
      description: data.description ?? null,
      status: "active",
      stock_quantity: 0,
    })
    .select("id, name, slug, price")
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, product }
}

// =============================================================================
// Bulk Update Prices
// =============================================================================

export async function bulkUpdatePrices(
  storeId: string,
  type: "percent_increase" | "percent_decrease" | "fixed_amount",
  amount: number
) {
  const supabase = await createClient()

  // Fetch all active products for this store
  const { data: products, error: fetchError } = await supabase
    .from("store_products")
    .select("id, price")
    .eq("store_id", storeId)
    .eq("status", "active")

  if (fetchError) {
    return { success: false as const, error: fetchError.message }
  }

  if (!products || products.length === 0) {
    return { success: false as const, error: "No active products found" }
  }

  let updatedCount = 0

  for (const product of products) {
    const currentPrice = Number(product.price)
    let newPrice: number

    switch (type) {
      case "percent_increase":
        newPrice = currentPrice * (1 + amount / 100)
        break
      case "percent_decrease":
        newPrice = currentPrice * (1 - amount / 100)
        break
      case "fixed_amount":
        newPrice = currentPrice + amount
        break
    }

    // Ensure price doesn't go below 0
    newPrice = Math.max(0, Math.round(newPrice * 100) / 100)

    const { error: updateError } = await supabase
      .from("store_products")
      .update({ price: newPrice })
      .eq("id", product.id)

    if (!updateError) {
      updatedCount++
    }
  }

  return {
    success: true as const,
    updatedCount,
    totalProducts: products.length,
  }
}

// =============================================================================
// Store Analytics
// =============================================================================

export async function getStoreAnalytics(
  storeId: string,
  period: "7d" | "30d" | "90d"
) {
  const supabase = await createClient()

  const daysMap = { "7d": 7, "30d": 30, "90d": 90 }
  const days = daysMap[period]

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startISO = startDate.toISOString()

  // Orders and revenue for the period
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total_amount, created_at")
    .eq("store_id", storeId)
    .gte("created_at", startISO)

  if (ordersError) {
    console.error("Failed to get orders for analytics:", ordersError)
  }

  const totalOrders = orders?.length ?? 0
  const totalRevenue = (orders ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount ?? 0),
    0
  )

  // Top products by order frequency using order_items
  const { data: topProducts, error: topError } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity")
    .in(
      "order_id",
      (orders ?? []).map((o) => o.id)
    )

  if (topError) {
    console.error("Failed to get top products:", topError)
  }

  // Aggregate top products
  const productMap = new Map<string, { name: string; totalQuantity: number }>()
  for (const item of topProducts ?? []) {
    const existing = productMap.get(item.product_id)
    if (existing) {
      existing.totalQuantity += Number(item.quantity ?? 0)
    } else {
      productMap.set(item.product_id, {
        name: item.product_name ?? "Unknown",
        totalQuantity: Number(item.quantity ?? 0),
      })
    }
  }

  const topProductsList = Array.from(productMap.entries())
    .map(([id, data]) => ({ id, name: data.name, totalQuantity: data.totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5)

  return {
    period,
    totalOrders,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    topProducts: topProductsList,
  }
}
