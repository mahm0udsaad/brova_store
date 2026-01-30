import { notFound } from "next/navigation"
import { getStoreProduct, getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { listStoreCategories } from "@/lib/supabase/queries/admin-categories"
import ProductEditorClient from "./product-editor-client"

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export default async function AdminProductPage({ params }: Props) {
  const { id, locale } = await params

  const [product, storeContext] = await Promise.all([
    getStoreProduct(id),
    getAdminStoreContext(),
  ])

  const categories = storeContext
    ? await listStoreCategories(storeContext.store.id)
    : []

  if (!product || !storeContext) {
    notFound()
  }

  return (
    <ProductEditorClient
      product={product}
      categories={categories}
      storeId={storeContext.store.id}
      locale={locale}
    />
  )
}
