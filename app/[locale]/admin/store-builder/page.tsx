import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { StoreBuilderClient } from "./store-builder-client"

export const metadata = {
  title: "Store Builder",
  description: "Build your store with AI assistance",
}

export default async function StoreBuilderPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const context = await getAdminStoreContext()
  const storeId = context?.store.id || null
  const onboardingStatus = (context?.store.onboarding_completed || "not_started") as
    | "not_started"
    | "in_progress"
    | "skipped"
    | "completed"

  return (
    <StoreBuilderClient
      locale={locale}
      storeId={storeId}
      onboardingStatus={onboardingStatus}
    />
  )
}
