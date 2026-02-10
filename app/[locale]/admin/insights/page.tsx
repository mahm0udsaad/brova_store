import { createAdminClient } from "@/lib/supabase/admin"
import { InsightsPageClient } from "./insights-page-client"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.insightsPage" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
}

export default async function InsightsPage() {
  const admin = createAdminClient()
  type RecentOrder = {
    id: string
    total_amount: number
    status: string
    created_at: string
  }
  type RecentOrderRow = {
    id: string
    total_amount: number | null
    status: string | null
    created_at: string
  }

  // Get date ranges
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const recentOrdersPromise = admin.from("orders")
    .select("id, total_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch various metrics
  const [
    { count: totalOrders },
    { count: ordersThisWeek },
    { count: ordersThisMonth },
    { data: topProducts },
    { count: totalProducts },
    { count: publishedProducts },
    { count: totalUsers },
    { data: aiUsage },
  ] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString()),
    admin.from("orders").select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    admin.from("products")
      .select("id, name, image_url, price")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }).eq("published", true),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("ai_usage")
      .select("*")
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .order("date", { ascending: false }),
  ])

  const recentOrdersResponse = await recentOrdersPromise

  // Calculate revenue
  const normalizedRecentOrders = (recentOrdersResponse.data || []) as RecentOrderRow[]
  const hydratedRecentOrders: RecentOrder[] = normalizedRecentOrders.map((order) => ({
    ...order,
    total_amount: order.total_amount ?? 0,
    status: order.status ?? "pending",
  }))
  const totalRevenue = hydratedRecentOrders.reduce(
    (acc, o) => acc + (o.total_amount || 0),
    0
  )

  return (
    <InsightsPageClient
      stats={{
        totalOrders: totalOrders || 0,
        ordersThisWeek: ordersThisWeek || 0,
        ordersThisMonth: ordersThisMonth || 0,
        totalRevenue,
        totalProducts: totalProducts || 0,
        publishedProducts: publishedProducts || 0,
        totalUsers: totalUsers || 0,
      }}
      recentOrders={hydratedRecentOrders as any}
      topProducts={(topProducts || []) as any}
      aiUsage={(aiUsage || []) as any}
    />
  )
}
