import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/utils"
import {
  getUserOrganization,
  ensureOrganizationForOnboarding,
  assignStoreTheme,
} from "@/lib/actions/setup"
import { StartPageClient } from "./start-page-client"

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Require authentication
  await requireAuth(locale)

  // ============================================================================
  // Check if user already has an organization
  // ============================================================================
  const organization = await getUserOrganization()

  if (organization) {
    // Organization exists but store was deleted/reset: recreate store and continue.
    if (!organization.storeId) {
      const ensured = await ensureOrganizationForOnboarding()
      if (!ensured.success) {
        return <div className="p-6 text-sm text-muted-foreground">Failed to initialize onboarding.</div>
      }
      return <StartPageClient locale={locale} initialStep="conversation" storeId={ensured.storeId} onboardingStatus="not_started" />
    }

    // Assign theme only when store type is known.
    if (!organization.themeId && organization.storeType) {
      await assignStoreTheme()
    }

    const onboardingStatus = organization.onboardingCompleted || "not_started"

    // Already done → go to admin
    if (onboardingStatus === "completed" || onboardingStatus === "skipped") {
      redirect(`/${locale}/admin`)
    }

    // Onboarding not done → show conversation step
    return (
      <StartPageClient
        locale={locale}
        initialStep="conversation"
        storeId={organization.storeId}
        onboardingStatus={onboardingStatus}
      />
    )
  }

  // No organization yet → create org + draft store, then begin AI conversation.
  const ensured = await ensureOrganizationForOnboarding()
  if (!ensured.success) {
    return <div className="p-6 text-sm text-muted-foreground">Failed to initialize onboarding.</div>
  }

  return (
    <StartPageClient
      locale={locale}
      initialStep="conversation"
      storeId={ensured.storeId}
      onboardingStatus="not_started"
    />
  )
}
