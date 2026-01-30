import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { models } from "@/lib/ai/gateway"
import type { AgentResult, AnalyticsQueryParams } from "./types"

export class AnalystAgent {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Execute an analytics-related action (READ ONLY)
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    switch (action) {
      case "get_sales_summary":
        return this.getSalesSummary(params as { period: "day" | "week" | "month" | "year"; startDate?: string; endDate?: string })
      case "get_top_products":
        return this.getTopProducts(params as { limit?: number; period?: "day" | "week" | "month" | "year" })
      case "get_order_stats":
        return this.getOrderStats(params as { period?: "day" | "week" | "month" | "year" })
      case "get_customer_insights":
        return this.getCustomerInsights(params as { period?: "day" | "week" | "month" | "year" })
      case "compare_periods":
        return this.comparePeriods(params as { period1: { start: string; end: string }; period2: { start: string; end: string } })
      case "get_ai_usage":
        return this.getAIUsage(params as { period?: "day" | "week" | "month" })
      case "analyze_trends":
        return this.analyzeTrends(params as { metric: "sales" | "products" | "customers" })
      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
          error: "Invalid action",
        }
    }
  }

  /**
   * Get sales summary for a period
   */
  private async getSalesSummary(params: {
    period: "day" | "week" | "month" | "year"
    startDate?: string
    endDate?: string
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { startDate, endDate } = this.getDateRange(params.period, params.startDate, params.endDate)

      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (error) throw error

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const completedOrders = orders.filter((o) => o.status === "delivered").length
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

      return {
        success: true,
        message: "Sales summary retrieved",
        data: {
          period: params.period,
          startDate,
          endDate,
          totalRevenue,
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          completedOrders,
          completionRate: Math.round(completionRate),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get sales summary",
        error: error.message,
      }
    }
  }

  /**
   * Get top performing products
   */
  private async getTopProducts(params: {
    limit?: number
    period?: "day" | "week" | "month" | "year"
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      // Get orders with items
      const { startDate } = this.getDateRange(params.period || "month")

      const { data: orders, error } = await supabase
        .from("orders")
        .select("items, total_amount, created_at")
        .gte("created_at", startDate)
        .eq("status", "delivered")

      if (error) throw error

      // Aggregate product sales
      const productSales: Record<string, { count: number; revenue: number; name: string }> = {}

      for (const order of orders) {
        const items = order.items as any[]
        if (!Array.isArray(items)) continue

        for (const item of items) {
          const productId = item.product_id || item.id
          const name = item.name || item.product_name || "Unknown"
          const quantity = item.quantity || 1
          const price = item.price || 0

          if (!productSales[productId]) {
            productSales[productId] = { count: 0, revenue: 0, name }
          }
          productSales[productId].count += quantity
          productSales[productId].revenue += price * quantity
        }
      }

      // Sort by revenue and take top N
      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, params.limit || 10)

      return {
        success: true,
        message: `Found top ${topProducts.length} products`,
        data: { topProducts },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get top products",
        error: error.message,
      }
    }
  }

  /**
   * Get order statistics
   */
  private async getOrderStats(params: {
    period?: "day" | "week" | "month" | "year"
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { startDate } = this.getDateRange(params.period || "month")

      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, created_at")
        .gte("created_at", startDate)

      if (error) throw error

      // Count by status
      const statusCounts: Record<string, number> = {}
      for (const order of orders) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
      }

      return {
        success: true,
        message: "Order stats retrieved",
        data: {
          total: orders.length,
          byStatus: statusCounts,
          pending: statusCounts["pending"] || 0,
          processing: statusCounts["processing"] || 0,
          shipped: statusCounts["shipped"] || 0,
          delivered: statusCounts["delivered"] || 0,
          cancelled: statusCounts["cancelled"] || 0,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get order stats",
        error: error.message,
      }
    }
  }

  /**
   * Get customer insights
   */
  private async getCustomerInsights(params: {
    period?: "day" | "week" | "month" | "year"
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })

      const { startDate } = this.getDateRange(params.period || "month")

      // Get new customers in period
      const { count: newCustomers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startDate)

      // Get repeat customers (customers with more than 1 order)
      const { data: orderCounts } = await supabase
        .from("orders")
        .select("user_id")

      const customerOrders: Record<string, number> = {}
      for (const order of orderCounts || []) {
        if (order.user_id) {
          customerOrders[order.user_id] = (customerOrders[order.user_id] || 0) + 1
        }
      }

      const repeatCustomers = Object.values(customerOrders).filter((c) => c > 1).length

      return {
        success: true,
        message: "Customer insights retrieved",
        data: {
          totalCustomers: totalCustomers || 0,
          newCustomers: newCustomers || 0,
          repeatCustomers,
          repeatRate: totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get customer insights",
        error: error.message,
      }
    }
  }

  /**
   * Compare two time periods
   */
  private async comparePeriods(params: {
    period1: { start: string; end: string }
    period2: { start: string; end: string }
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      // Get data for period 1
      const { data: orders1 } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", params.period1.start)
        .lte("created_at", params.period1.end)

      // Get data for period 2
      const { data: orders2 } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", params.period2.start)
        .lte("created_at", params.period2.end)

      const revenue1 = orders1?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const revenue2 = orders2?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const orders1Count = orders1?.length || 0
      const orders2Count = orders2?.length || 0

      const revenueChange = revenue1 > 0 ? ((revenue2 - revenue1) / revenue1) * 100 : 0
      const ordersChange = orders1Count > 0 ? ((orders2Count - orders1Count) / orders1Count) * 100 : 0

      return {
        success: true,
        message: "Period comparison complete",
        data: {
          period1: {
            revenue: revenue1,
            orders: orders1Count,
            dates: params.period1,
          },
          period2: {
            revenue: revenue2,
            orders: orders2Count,
            dates: params.period2,
          },
          change: {
            revenue: Math.round(revenueChange),
            orders: Math.round(ordersChange),
          },
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to compare periods",
        error: error.message,
      }
    }
  }

  /**
   * Get AI usage statistics
   */
  private async getAIUsage(params: {
    period?: "day" | "week" | "month"
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { startDate } = this.getDateRange(params.period || "month")

      const { data: usage, error } = await supabase
        .from("ai_usage")
        .select("*")
        .eq("merchant_id", this.userId)
        .gte("date", startDate.split("T")[0])

      if (error) throw error

      const totals = usage.reduce(
        (acc, u) => ({
          operations: acc.operations + u.count,
          tokens: acc.tokens + u.tokens_used,
          cost: acc.cost + Number(u.cost_estimate),
        }),
        { operations: 0, tokens: 0, cost: 0 }
      )

      // Group by operation type
      const byOperation: Record<string, number> = {}
      for (const u of usage) {
        byOperation[u.operation] = (byOperation[u.operation] || 0) + u.count
      }

      return {
        success: true,
        message: "AI usage retrieved",
        data: {
          totalOperations: totals.operations,
          totalTokens: totals.tokens,
          estimatedCost: totals.cost.toFixed(2),
          byOperation,
          period: params.period || "month",
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get AI usage",
        error: error.message,
      }
    }
  }

  /**
   * Analyze trends and provide insights
   */
  private async analyzeTrends(params: {
    metric: "sales" | "products" | "customers"
  }): Promise<AgentResult> {
    try {
      // Get relevant data
      let data: any

      switch (params.metric) {
        case "sales":
          data = await this.getSalesSummary({ period: "month" })
          break
        case "products":
          data = await this.getTopProducts({ period: "month", limit: 5 })
          break
        case "customers":
          data = await this.getCustomerInsights({ period: "month" })
          break
      }

      if (!data.success) {
        return data
      }

      // Use AI to analyze and provide insights
      const prompt = `Analyze this ${params.metric} data and provide 3 brief, actionable insights for a streetwear store:

Data: ${JSON.stringify(data.data, null, 2)}

Keep insights concise and specific. Focus on:
1. Key observations
2. Potential opportunities
3. Recommended actions`

      const result = await generateText({
        model: models.flash,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 400,
      })

      return {
        success: true,
        message: "Trend analysis complete",
        data: {
          metric: params.metric,
          rawData: data.data,
          insights: result.text,
        },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to analyze trends",
        error: error.message,
      }
    }
  }

  /**
   * Helper to calculate date ranges
   */
  private getDateRange(
    period: "day" | "week" | "month" | "year",
    startDate?: string,
    endDate?: string
  ): { startDate: string; endDate: string } {
    if (startDate && endDate) {
      return { startDate, endDate }
    }

    const now = new Date()
    const end = now.toISOString()
    let start: Date

    switch (period) {
      case "day":
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        break
      case "week":
        start = new Date(now)
        start.setDate(start.getDate() - 7)
        break
      case "month":
        start = new Date(now)
        start.setMonth(start.getMonth() - 1)
        break
      case "year":
        start = new Date(now)
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        start = new Date(now)
        start.setMonth(start.getMonth() - 1)
    }

    return {
      startDate: start.toISOString(),
      endDate: end,
    }
  }
}
