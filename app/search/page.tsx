import SearchPageClient from "./search-page-client"
import { listStorefrontProducts } from "@/lib/supabase/queries/products"

export default async function SearchPage() {
  const { data: products } = await listStorefrontProducts()
  return <SearchPageClient products={products} />
}
