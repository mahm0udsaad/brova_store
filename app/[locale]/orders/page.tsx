import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UserOrdersPageClient from "./user-orders-page-client"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "ordersPage" })
  return {
    title: `${t("title")} | Brova`,
    description: t("subtitle"),
  }
}

export default async function UserOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}`)
  }

  // Parallelize orders and notifications fetch (both depend on user.id)
  const [
    { data: orders, error },
    { data: notifications }
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        *,
        order_status_history (
          *
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
  ])

  if (error) {
    console.error("Error fetching orders:", error)
  }

  return (
    <UserOrdersPageClient 
      initialOrders={orders || []} 
      initialNotifications={notifications || []}
    />
  )
}
