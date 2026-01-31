"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  Bot,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAdminAssistantActions } from "@/components/admin-assistant/AdminAssistantProvider"
import { useTranslations } from "next-intl"

interface Stats {
  totalOrders: number
  ordersThisWeek: number
  ordersThisMonth: number
  totalRevenue: number
  totalProducts: number
  publishedProducts: number
  totalUsers: number
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
}

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
}

interface AIUsage {
  id: string
  operation: string
  date: string
  count: number
  tokens_used: number
  cost_estimate: number
}

interface InsightsPageClientProps {
  stats: Stats
  recentOrders: Order[]
  topProducts: Product[]
  aiUsage: AIUsage[]
}

export function InsightsPageClient({
  stats,
  recentOrders,
  topProducts,
  aiUsage,
}: InsightsPageClientProps) {
  const t = useTranslations("admin")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")
  const { setPageContext } = useAdminAssistantActions() // Only subscribes to stable actions

  // Set page context for AI assistant — run once, timeRange doesn't affect context meaningfully
  useEffect(() => {
    setPageContext({
      pageName: t("insightsPage.title"),
      pageType: "insights",
      selectedItems: [],
      filters: { timeRange },
      capabilities: [
        t("insightsPage.capabilities.bestSellers"),
        t("insightsPage.capabilities.compare"),
        t("insightsPage.capabilities.revenueTrends"),
        t("insightsPage.capabilities.customerInsights"),
        t("insightsPage.capabilities.productPerformance"),
        t("insightsPage.capabilities.aiUsage"),
      ],
    })
  }, [setPageContext, t, timeRange])

  // Memoize AI usage totals
  const aiTotals = useMemo(() => aiUsage.reduce(
    (acc, u) => ({
      totalOperations: acc.totalOperations + u.count,
      totalTokens: acc.totalTokens + u.tokens_used,
      totalCost: acc.totalCost + Number(u.cost_estimate),
    }),
    { totalOperations: 0, totalTokens: 0, totalCost: 0 }
  ), [aiUsage])

  const statusLabels: Record<string, string> = useMemo(() => ({
    delivered: t("insightsPage.orderStatus.delivered"),
    pending: t("insightsPage.orderStatus.pending"),
    processing: t("insightsPage.orderStatus.processing"),
  }), [t])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("insightsPage.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("insightsPage.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month", "year"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {t(`insightsPage.timeRanges.${range}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("insightsPage.metrics.totalRevenue")}
            value={`EGP ${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={12}
            color="green"
          />
          <MetricCard
            title={t("insightsPage.metrics.orders")}
            value={stats.ordersThisMonth.toString()}
            subtitle={t("insightsPage.metrics.ordersThisWeek", { count: stats.ordersThisWeek })}
            icon={ShoppingCart}
            trend={8}
            color="blue"
          />
          <MetricCard
            title={t("insightsPage.metrics.products")}
            value={stats.publishedProducts.toString()}
            subtitle={t("insightsPage.metrics.productsTotal", { count: stats.totalProducts })}
            icon={Package}
            trend={0}
            color="violet"
          />
          <MetricCard
            title={t("insightsPage.metrics.customers")}
            value={stats.totalUsers.toString()}
            icon={Users}
            trend={15}
            color="orange"
          />
        </div>

        {/* AI Assistant Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("insightsPage.ai.title")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("insightsPage.ai.subtitle")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("insightsPage.recentOrders.title")}</h3>
              <Button variant="ghost" size="sm">
                {t("insightsPage.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      EGP {order.total_amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    order.status === "delivered" && "bg-green-500/10 text-green-500",
                    order.status === "pending" && "bg-yellow-500/10 text-yellow-500",
                    order.status === "processing" && "bg-blue-500/10 text-blue-500"
                  )}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("insightsPage.recentOrders.empty")}
                </p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("insightsPage.topProducts.title")}</h3>
              <Button variant="ghost" size="sm">
                {t("insightsPage.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <span className="text-sm font-bold text-muted-foreground w-5">
                    #{idx + 1}
                  </span>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      EGP {product.price?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("insightsPage.topProducts.empty")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Usage */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold">{t("insightsPage.aiUsage.title")}</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold">{aiTotals.totalOperations}</p>
              <p className="text-xs text-muted-foreground">{t("insightsPage.aiUsage.operations")}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold">
                {(aiTotals.totalTokens / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground">{t("insightsPage.aiUsage.tokens")}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold">
                ${aiTotals.totalCost.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{t("insightsPage.aiUsage.cost")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend: number
  color: "green" | "blue" | "violet" | "orange"
}) {
  const colorClasses = {
    green: "text-green-500 bg-green-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    violet: "text-violet-500 bg-violet-500/10",
    orange: "text-orange-500 bg-orange-500/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend > 0 ? "text-green-500" : "text-red-500"
          )}>
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
})
