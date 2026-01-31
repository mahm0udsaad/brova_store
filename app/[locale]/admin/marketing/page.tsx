import { createAdminClient } from "@/lib/supabase/admin"
import { MarketingPageClient } from "./marketing-page-client"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.marketingPage" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
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
