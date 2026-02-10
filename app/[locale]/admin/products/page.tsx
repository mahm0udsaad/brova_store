import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { listProductsPaginated } from "@/lib/supabase/queries/admin-products"
import { listStoreCategories } from "@/lib/supabase/queries/admin-categories"
import ProductsPageClient from "./products-page-client"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.products" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
}

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  const storeContext = await getAdminStoreContext()

  if (!storeContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("storeMissing.title")}</h1>
          <p className="text-muted-foreground">
            {t("storeMissing.subtitle")}
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
      initialProducts={productData.products as any}
      initialNextCursor={productData.nextCursor}
      initialTotalCount={productData.totalCount}
      categories={categories as any}
    />
  )
}
