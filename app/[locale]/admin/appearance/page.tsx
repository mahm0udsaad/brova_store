import { createAdminClient } from "@/lib/supabase/admin"
import { AppearancePageClient } from "./appearance-page-client"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { listThemeConfigs } from "@/lib/themes"

export const metadata = {
  title: "Appearance",
  description: "Customize your store's look and feel",
}

export default async function AppearancePage() {
  const admin = createAdminClient()
  const storeContext = await getAdminStoreContext()

  // Fetch store settings
  const { data: settings } = await admin
    .from("store_settings")
    .select("*")
    .single()

  const storeType = storeContext?.store.type || "clothing"
  const themeConfigs = listThemeConfigs().filter((theme) =>
    theme.supportedStoreTypes.includes(storeType)
  )

  return (
    <AppearancePageClient
      initialSettings={settings}
      currentThemeId={storeContext?.store.theme_id || null}
      themeConfigs={themeConfigs}
      storeId={storeContext?.store.id || "default"}
    />
  )
}