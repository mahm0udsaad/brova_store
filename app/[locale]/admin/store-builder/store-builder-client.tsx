"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { ConciergeProvider } from "@/components/admin-concierge/ConciergeProvider"
import { ConciergeFullPageLayout } from "@/components/admin-concierge/ConciergeFullPageLayout"
import type { OnboardingStatus } from "@/lib/ai/concierge-context"

interface StoreBuilderClientProps {
  locale: string
  storeId: string | null
  onboardingStatus: OnboardingStatus
}

export function StoreBuilderClient({
  locale,
  storeId,
  onboardingStatus,
}: StoreBuilderClientProps) {
  const router = useRouter()
  const currentLocale = useLocale()

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground text-sm">
        {currentLocale === "ar"
          ? "لم يتم العثور على متجر. أنشئ متجرك أولاً."
          : "No store found. Create your store first."}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <ConciergeProvider
        initialStoreState="draft"
        initialOnboardingStatus={onboardingStatus}
        storeId={storeId}
      >
        <ConciergeFullPageLayout
          storeId={storeId}
          onRequestReview={() => router.push(`/${locale}/admin`)}
        />
      </ConciergeProvider>
    </div>
  )
}
