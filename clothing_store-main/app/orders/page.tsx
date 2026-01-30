import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UserOrdersPageClient from "./user-orders-page-client"

export const metadata = {
  title: "My Orders | Brova",
  description: "Track your orders and view order history",
}

export default async function UserOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Fetch user's orders
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_status_history (
        *
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
  }

  // Fetch user notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <UserOrdersPageClient 
      initialOrders={orders || []} 
      initialNotifications={notifications || []}
    />
  )
}
