import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { MarketingPageClient } from "./marketing-page-client"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.marketingPage" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
}

export default async function MarketingPage() {
  const supabase = await createServerClient()
  const admin = createAdminClient()

  // Get current user and their store
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's organization and store
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!org) {
    redirect("/onboarding")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", org.id)
    .single()

  if (!store) {
    redirect("/onboarding")
  }

  // Fetch campaigns
  const { data: campaigns } = await admin
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch products for this store
  const { data: products } = await supabase
    .from("store_products")
    .select("id, name")
    .eq("store_id", store.id)
    .order("name")

  return (
    <MarketingPageClient
      initialCampaigns={(campaigns || []) as any}
      products={(products || []) as any}
      storeId={store.id}
    />
  )
}
