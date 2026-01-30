import type { ProductGridProps } from '../types'
import HomePageClient from './components/home-page-client'
import { getStorefrontCategoryEntities } from '@/lib/supabase/queries/storefront'
import type { CategoryOption } from './components/types'

export async function ClothingStoreV2ProductGrid({ products, locale, storeId, emptyMessage }: ProductGridProps) {
  const resolvedStoreId = storeId || products[0]?.store_id
  let categories: CategoryOption[] = []

  if (resolvedStoreId) {
    const storeCategories = await getStorefrontCategoryEntities(resolvedStoreId)
    categories = storeCategories.map((category) => ({
      id: category.slug || category.id,
      label: locale === 'ar' && category.name_ar ? category.name_ar : category.name,
      imageUrl: category.image_url,
      matchKeys: [category.name, category.name_ar, category.slug].filter(Boolean) as string[],
    }))
  }

  if (categories.length === 0) {
    const uniqueCategories = new Map<string, CategoryOption>()
    products.forEach((product) => {
      const label = locale === 'ar' && product.category_ar ? product.category_ar : product.category
      if (!label) return

      const key = label.toLowerCase()
      if (!uniqueCategories.has(key)) {
        uniqueCategories.set(key, {
          id: key,
          label,
          matchKeys: [label, product.category, product.category_ar].filter(Boolean) as string[],
        })
      }
    })

    categories = Array.from(uniqueCategories.values())
  }

  return (
    <HomePageClient
      products={products}
      categories={categories}
      locale={locale}
      emptyMessage={emptyMessage}
    />
  )
}
