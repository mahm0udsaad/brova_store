import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { DashboardSummary, AnalyticsSummary } from "./types"

// ============================================================================
// Tool: Get Dashboard Summary
// ============================================================================

export const getDashboardSummary = tool({
  description:
    "Get a summary of the merchant dashboard including today's orders, revenue, new customers, and low-stock products",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID to get summary for"),
  }),
  execute: async ({ storeId }): Promise<DashboardSummary> => {
    const supabase = await createClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    // Fetch today's orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_amount, currency")
      .eq("store_id", storeId)
      .gte("created_at", todayISO)

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    const todayOrders = orders?.length ?? 0
    const todayRevenue = (orders ?? []).reduce(
      (sum, o) => sum + Number(o.total_amount ?? 0),
      0
    )
    const currency = orders?.[0]?.currency ?? "SAR"

    // Fetch new customers today
    const { count: newCustomers, error: customersError } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", todayISO)

    if (customersError) {
      throw new Error(`Failed to fetch customers: ${customersError.message}`)
    }

    // Fetch low-stock products (stock <= 5)
    const { data: lowStock, error: stockError } = await supabase
      .from("store_products")
      .select("id, name, stock_quantity")
      .eq("store_id", storeId)
      .eq("status", "active")
      .lte("stock_quantity", 5)
      .order("stock_quantity", { ascending: true })
      .limit(10)

    if (stockError) {
      throw new Error(`Failed to fetch low-stock products: ${stockError.message}`)
    }

    return {
      todayOrders,
      todayRevenue,
      newCustomers: newCustomers ?? 0,
      lowStockProducts: (lowStock ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity ?? 0,
      })),
      currency,
    }
  },
})

// ============================================================================
// Tool: Get Recent Orders
// ============================================================================

export const getRecentOrders = tool({
  description: "Get the most recent orders for a store",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Number of recent orders to return"),
  }),
  execute: async ({ storeId, limit }) => {
    const supabase = await createClient()

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, currency, created_at, customer_name, customer_email"
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch recent orders: ${error.message}`)
    }

    return {
      orders: (orders ?? []).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        total: Number(o.total_amount ?? 0),
        currency: o.currency ?? "SAR",
        createdAt: o.created_at,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
      })),
      count: orders?.length ?? 0,
    }
  },
})

// ============================================================================
// Tool: Quick Create Product
// ============================================================================

export const quickCreateProduct = tool({
  description:
    "Quickly create a new product in the store with basic details",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    name: z.string().describe("Product name"),
    price: z.number().min(0).describe("Product price in SAR"),
    description: z
      .string()
      .optional()
      .describe("Optional product description"),
  }),
  execute: async ({ storeId, name, price, description }) => {
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from("store_products")
      .insert({
        store_id: storeId,
        name,
        price,
        description: description ?? null,
        status: "active",
        stock_quantity: 0,
        currency: "SAR",
      })
      .select("id, name, price, status")
      .single()

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`)
    }

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        status: product.status,
      },
    }
  },
})

// ============================================================================
// Tool: Update Product Stock
// ============================================================================

export const updateProductStock = tool({
  description: "Update the stock/inventory quantity of a specific product",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to update"),
    storeId: z.string().describe("The store ID (for authorization)"),
    newQuantity: z
      .number()
      .min(0)
      .describe("The new stock quantity to set"),
  }),
  execute: async ({ productId, storeId, newQuantity }) => {
    const supabase = await createClient()

    // Verify product belongs to the store
    const { data: existing, error: fetchError } = await supabase
      .from("store_products")
      .select("id, name, stock_quantity")
      .eq("id", productId)
      .eq("store_id", storeId)
      .single()

    if (fetchError || !existing) {
      throw new Error("Product not found or does not belong to this store")
    }

    const previousQuantity = existing.stock_quantity ?? 0

    const { error: updateError } = await supabase
      .from("store_products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId)
      .eq("store_id", storeId)

    if (updateError) {
      throw new Error(`Failed to update stock: ${updateError.message}`)
    }

    return {
      success: true,
      productId,
      productName: existing.name,
      previousQuantity,
      newQuantity,
    }
  },
})

// ============================================================================
// Tool: Bulk Update Prices
// ============================================================================

export const bulkUpdatePrices = tool({
  description:
    "Bulk update prices for all active products in the store. WARNING: This is a destructive operation - the assistant must confirm with the merchant before executing.",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    adjustmentType: z
      .enum(["percent_increase", "percent_decrease", "fixed_amount"])
      .describe(
        "Type of price adjustment: percent_increase, percent_decrease, or fixed_amount (added to current price)"
      ),
    amount: z
      .number()
      .min(0)
      .describe(
        "Adjustment amount - percentage (e.g. 10 for 10%) or fixed SAR amount"
      ),
  }),
  execute: async ({ storeId, adjustmentType, amount }) => {
    const supabase = await createClient()

    // Fetch all active products
    const { data: products, error: fetchError } = await supabase
      .from("store_products")
      .select("id, name, price")
      .eq("store_id", storeId)
      .eq("status", "active")

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`)
    }

    if (!products || products.length === 0) {
      return {
        success: false,
        message: "No active products found to update",
        updatedCount: 0,
      }
    }

    let updatedCount = 0
    const updates: Array<{ name: string; oldPrice: number; newPrice: number }> =
      []

    for (const product of products) {
      const oldPrice = Number(product.price)
      let newPrice: number

      switch (adjustmentType) {
        case "percent_increase":
          newPrice = oldPrice * (1 + amount / 100)
          break
        case "percent_decrease":
          newPrice = oldPrice * (1 - amount / 100)
          break
        case "fixed_amount":
          newPrice = oldPrice + amount
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
        updates.push({
          name: product.name,
          oldPrice,
          newPrice,
        })
      }
    }

    return {
      success: true,
      updatedCount,
      totalProducts: products.length,
      adjustmentType,
      amount,
      updates,
    }
  },
})

// ============================================================================
// Tool: Get Store Analytics
// ============================================================================

export const getStoreAnalytics = tool({
  description:
    "Get store analytics including revenue, orders, average order value, and top products for a given period",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    period: z
      .enum(["7d", "30d", "90d"])
      .default("30d")
      .describe("Analytics period: 7d, 30d, or 90d"),
  }),
  execute: async ({ storeId, period }): Promise<AnalyticsSummary> => {
    const supabase = await createClient()

    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    }
    const days = daysMap[period] ?? 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startISO = startDate.toISOString()

    // Fetch orders in period
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_amount, currency, created_at")
      .eq("store_id", storeId)
      .gte("created_at", startISO)

    if (ordersError) {
      throw new Error(`Failed to fetch analytics: ${ordersError.message}`)
    }

    const totalOrders = orders?.length ?? 0
    const totalRevenue = (orders ?? []).reduce(
      (sum, o) => sum + Number(o.total_amount ?? 0),
      0
    )
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const currency = orders?.[0]?.currency ?? "SAR"

    // Fetch top products by order items
    const { data: topItems, error: topError } = await supabase
      .from("order_items")
      .select(
        "product_name, quantity, total_price, order:orders!inner(store_id, created_at)"
      )
      .eq("order.store_id", storeId)
      .gte("order.created_at", startISO)

    if (topError) {
      // Non-critical: return analytics without top products
      return {
        period,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topProducts: [],
        currency,
      }
    }

    // Aggregate top products
    const productMap = new Map<
      string,
      { sold: number; revenue: number }
    >()

    for (const item of topItems ?? []) {
      const name = item.product_name ?? "Unknown"
      const existing = productMap.get(name) ?? { sold: 0, revenue: 0 }
      existing.sold += Number(item.quantity ?? 0)
      existing.revenue += Number(item.total_price ?? 0)
      productMap.set(name, existing)
    }

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        sold: data.sold,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      period,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topProducts,
      currency,
    }
  },
})

// ============================================================================
// Tool: Update Theme Colors
// ============================================================================

export const updateThemeColors = tool({
  description:
    "Update the store's theme colors (primary, secondary, accent, background, text)",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    colors: z.object({
      primary: z
        .string()
        .optional()
        .describe("Primary color hex code, e.g. #3B82F6"),
      secondary: z
        .string()
        .optional()
        .describe("Secondary color hex code"),
      accent: z
        .string()
        .optional()
        .describe("Accent color hex code"),
      background: z
        .string()
        .optional()
        .describe("Background color hex code"),
      text: z
        .string()
        .optional()
        .describe("Text color hex code"),
    }),
  }),
  execute: async ({ storeId, colors }) => {
    const supabase = await createClient()

    // Fetch current store settings
    const { data: settings, error: fetchError } = await supabase
      .from("store_settings")
      .select("id, theme_config")
      .eq("store_id", storeId)
      .single()

    if (fetchError || !settings) {
      throw new Error("Store settings not found")
    }

    const currentTheme =
      (settings.theme_config as Record<string, unknown>) ?? {}
    const currentColors =
      (currentTheme.colors as Record<string, string>) ?? {}

    // Merge new colors with existing ones (only update provided fields)
    const updatedColors = {
      ...currentColors,
      ...(colors.primary && { primary: colors.primary }),
      ...(colors.secondary && { secondary: colors.secondary }),
      ...(colors.accent && { accent: colors.accent }),
      ...(colors.background && { background: colors.background }),
      ...(colors.text && { text: colors.text }),
    }

    const updatedTheme = {
      ...currentTheme,
      colors: updatedColors,
    }

    const { error: updateError } = await supabase
      .from("store_settings")
      .update({ theme_config: updatedTheme })
      .eq("store_id", storeId)

    if (updateError) {
      throw new Error(`Failed to update theme colors: ${updateError.message}`)
    }

    return {
      success: true,
      updatedColors,
    }
  },
})
