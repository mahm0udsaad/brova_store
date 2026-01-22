import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: draftProducts },
    { count: totalUsers },
    { count: tryOnUsage },
    { count: totalOrders },
    { count: pendingOrders },
    { count: deliveredOrders },
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }).eq("published", true),
    admin.from("products").select("id", { count: "exact", head: true }).eq("published", false),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("try_on_history").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of products, users, and try-on usage.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
              Manage Orders
            </Link>
            <Link href="/admin/inventory" className="text-sm font-semibold text-primary hover:underline">
              Manage Inventory
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold mt-2">{totalOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Pending: {pendingOrders ?? 0} · Delivered: {deliveredOrders ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold mt-2">{totalProducts ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Active: {activeProducts ?? 0} · Draft: {draftProducts ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold mt-2">{totalUsers ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Registered profiles</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Try-On Usage</p>
            <p className="text-2xl font-bold mt-2">{tryOnUsage ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Total history events</p>
          </div>
        </div>
      </div>
    </div>
  )
}
