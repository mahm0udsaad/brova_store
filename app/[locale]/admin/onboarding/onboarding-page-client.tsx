"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConciergeProvider, useConcierge } from "@/components/admin-concierge/ConciergeProvider"
import { ConciergeOnboarding } from "@/components/admin-concierge/ConciergeOnboarding"
import type { OnboardingStatus } from "@/lib/ai/concierge-context"

interface OnboardingPageClientProps {
  locale: string
  initialOnboardingStatus?: OnboardingStatus
  storeId?: string | null
}

export function OnboardingPageClient({
  locale,
  initialOnboardingStatus = "not_started",
  storeId = null,
}: OnboardingPageClientProps) {
  return (
    <ConciergeProvider
      initialStoreState="empty"
      initialOnboardingStatus={initialOnboardingStatus}
      storeId={storeId}
    >
      <OnboardingContent locale={locale} />
    </ConciergeProvider>
  )
}

function OnboardingContent({ locale }: { locale: string }) {
  const router = useRouter()
  const { onboardingStatus } = useConcierge()

  // Redirect if onboarding is completed or skipped
  useEffect(() => {
    if (onboardingStatus === "completed" || onboardingStatus === "skipped") {
      router.push(`/${locale}/admin`)
    }
  }, [onboardingStatus, locale, router])

  return (
    <div className="min-h-screen bg-background">
      <ConciergeOnboarding />
    </div>
  )
}
