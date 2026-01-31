import { createClient } from "@/lib/supabase/server"
import { SettingsPageClient } from "./settings-page-client"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.settingsPage" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Resolve store
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!org) {
    // Handle case where org is missing?
    return <div>{t("storeMissing.title")}</div>
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", org.id)
    .single()
    
  if (!store) {
     return <div>{t("storeMissing.title")}</div>
  }

  // Fetch store settings (using RLS or store_id)
  // Assuming store_settings has store_id or merchant_id. 
  // Based on previous search, it has merchant_id (user.id) or store_id.
  // The client code used merchant_id: user.id. 
  // Let's try fetching by merchant_id first as per existing pattern
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("merchant_id", user.id)
    .single()

  // Fetch store contact
  const { data: contact } = await supabase
    .from("store_contact")
    .select("*")
    .eq("store_id", store.id)
    .single()

  // Fetch AI usage for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: aiUsage } = await supabase
    .from("ai_usage")
    .select("*")
    .gte("date", startOfMonth.toISOString().split("T")[0])

  return (
    <SettingsPageClient
      initialSettings={settings}
      initialContact={contact}
      aiUsage={aiUsage || []}
    />
  )
}