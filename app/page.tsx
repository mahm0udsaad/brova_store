import HomePageClient from "./home-page-client"
import { listStorefrontProducts } from "@/lib/supabase/queries/products"

export default async function HomePage() {
  const { data: products } = await listStorefrontProducts()
  return <HomePageClient products={products} />
}
