export interface DashboardSummary {
  todayOrders: number
  todayRevenue: number
  newCustomers: number
  lowStockProducts: Array<{ id: string; name: string; stock: number }>
  currency: string
}

export interface AnalyticsSummary {
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{ name: string; sold: number; revenue: number }>
  currency: string
}

export interface DashboardAssistantContext {
  storeId: string
  merchantId: string
  locale: "ar" | "en"
}
