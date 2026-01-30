import { createClient } from "@/lib/supabase/server"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import OrdersPageClient from "./orders-page-client"

export const metadata = {
  title: "Order Management | Admin",
  description: "Manage customer orders and send updates",
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Get user's store context for tenant isolation
  const context = await getAdminStoreContext()
  if (!context) {
    console.error('[AdminOrdersPage] No store context found')
    return <OrdersPageClient initialOrders={[]} />
  }

  // Fetch orders filtered by store_id (tenant-scoped)
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_status_history (
        *
      )
    `)
    .eq("store_id", context.store.id) // Tenant isolation
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching orders:", error)
  }

  return <OrdersPageClient initialOrders={orders || []} />
}
