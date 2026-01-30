import { createAdminClient } from "@/lib/supabase/admin"
import { MarketingPageClient } from "./marketing-page-client"

export const metadata = {
  title: "Marketing",
  description: "Manage marketing campaigns and generated content",
}

export default async function MarketingPage() {
  const admin = createAdminClient()

  // Fetch campaigns
  const { data: campaigns } = await admin
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch products for campaign targeting
  const { data: products } = await admin
    .from("products")
    .select("id, name, image_url, price, category_id")
    .eq("published", true)
    .order("name")

  return (
    <MarketingPageClient
      initialCampaigns={campaigns || []}
      products={products || []}
    />
  )
}
