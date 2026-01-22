import { createAdminClient } from "@/lib/supabase/admin"
import OrdersPageClient from "./orders-page-client"

export const metadata = {
  title: "Order Management | Admin",
  description: "Manage customer orders and send updates",
}

export default async function AdminOrdersPage() {
  const supabase = createAdminClient()

  // Fetch orders with user details
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_status_history (
        *
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching orders:", error)
  }

  return <OrdersPageClient initialOrders={orders || []} />
}
