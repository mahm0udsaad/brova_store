import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin/is-admin"

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    redirect("/")
  }

  const admin = createAdminClient()

  const [{ count: totalProducts }, { count: activeProducts }, { count: draftProducts }, { count: totalUsers }, { count: tryOnUsage }] =
    await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("products").select("id", { count: "exact", head: true }).eq("published", true),
      admin.from("products").select("id", { count: "exact", head: true }).eq("published", false),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("try_on_history").select("id", { count: "exact", head: true }),
    ])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of products, users, and try-on usage.</p>
          </div>
          <Link href="/admin/inventory" className="text-sm font-semibold text-primary">
            Manage Inventory
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
