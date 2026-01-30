import { createAdminClient } from "@/lib/supabase/admin"
import { MediaPageClient } from "./media-page-client"

export const metadata = {
  title: "Media Library",
  description: "Manage your product images and AI-generated assets",
}

export default async function MediaPage() {
  const admin = createAdminClient()

  // Fetch generated assets
  const { data: assets, error } = await admin
    .from("generated_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch products for filtering
  const { data: products } = await admin
    .from("products")
    .select("id, name, image_url")
    .order("name")

  return (
    <MediaPageClient
      initialAssets={assets || []}
      products={products || []}
    />
  )
}
