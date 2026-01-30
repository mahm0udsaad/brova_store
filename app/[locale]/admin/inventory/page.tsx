import { getStoreProducts, getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import InventoryPageClient from "./inventory-page-client"

// Simplified product view for inventory list
type InventoryProductRow = {
  id: string
  name: string
  name_ar: string | null
  price: number
  category: string | null
  category_ar: string | null
  image_url: string | null
  status: 'draft' | 'active'
  inventory: number
  slug: string
}

export default async function AdminInventoryPage() {
  // Get user's store context
  const storeContext = await getAdminStoreContext()

  // If no store, show empty state
  if (!storeContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">No Store Found</h1>
          <p className="text-muted-foreground">
            Please complete your store setup to manage inventory.
          </p>
        </div>
      </div>
    )
  }

  // Fetch all products for this store (tenant-scoped)
  const allProducts = await getStoreProducts({
    orderBy: 'created_at',
    ascending: false
  })

  // Map to inventory view format
  const products: InventoryProductRow[] = allProducts.map(p => ({
    id: p.id,
    name: p.name,
    name_ar: p.name_ar,
    price: Number(p.price),
    category: p.category,
    category_ar: p.category_ar,
    image_url: p.image_url,
    status: p.status,
    inventory: p.inventory,
    slug: p.slug,
  }))

  return <InventoryPageClient initialProducts={products} />
}
