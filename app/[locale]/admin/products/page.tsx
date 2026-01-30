import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { listProductsPaginated } from "@/lib/supabase/queries/admin-products"
import { listStoreCategories } from "@/lib/supabase/queries/admin-categories"
import ProductsPageClient from "./products-page-client"

export default async function AdminProductsPage() {
  const storeContext = await getAdminStoreContext()

  if (!storeContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">No Store Found</h1>
          <p className="text-muted-foreground">
            Please complete your store setup to manage products.
          </p>
        </div>
      </div>
    )
  }

  const [productData, categories] = await Promise.all([
    listProductsPaginated({ limit: 20 }),
    listStoreCategories(storeContext.store.id),
  ])

  return (
    <ProductsPageClient
      initialProducts={productData.products}
      initialNextCursor={productData.nextCursor}
      initialTotalCount={productData.totalCount}
      categories={categories}
    />
  )
}
