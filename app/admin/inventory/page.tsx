import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin/is-admin"

type AdminProductRow = {
  id: string
  name: string
  price: number | null
  category_id: string | null
  image_url: string | null
  published: boolean | null
}

export default async function AdminInventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    redirect("/")
  }

  const admin = createAdminClient()
  const { data: products } = await admin
    .from("products")
    .select("id,name,price,category_id,image_url,published")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">Manage product availability, pricing, and sizes.</p>
          </div>
          <Link href="/admin" className="text-sm font-semibold text-primary">
            Back to Dashboard
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground">
            <span className="col-span-2">Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-border">
            {(products as AdminProductRow[] | null)?.map((product) => {
              const pendingPricing = !product.price || product.price <= 0
              return (
                <div key={product.id} className="grid grid-cols-6 gap-4 px-4 py-4 items-center">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      {pendingPricing && (
                        <p className="text-xs text-amber-500 font-medium">Pending pricing</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.category_id || "Uncategorized"}</p>
                  <p className="text-sm font-semibold">
                    {pendingPricing ? "—" : `EGP ${product.price?.toLocaleString()}`}
                  </p>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${
                      product.published ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {product.published ? "Published" : "Draft"}
                  </span>
                  <div className="text-right">
                    <Link href={`/admin/products/${product.id}`} className="text-sm font-semibold text-primary">
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
