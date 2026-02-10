import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { listStoreCategories } from "@/lib/supabase/queries/admin-categories"
import CategoriesPageClient from "./categories-page-client"
import { getTranslations } from "next-intl/server"

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  const storeContext = await getAdminStoreContext()
  const categories = storeContext
    ? await listStoreCategories(storeContext.store.id)
    : []

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

  return <CategoriesPageClient initialCategories={categories as any} />
}
