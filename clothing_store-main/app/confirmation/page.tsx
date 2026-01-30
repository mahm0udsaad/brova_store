import ConfirmationPageClient from "./confirmation-page-client"
import { listStorefrontProducts } from "@/lib/supabase/queries/products"

export default async function ConfirmationPage() {
  const { data: products } = await listStorefrontProducts()
  return <ConfirmationPageClient products={products} />
}
