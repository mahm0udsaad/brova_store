import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { OnboardingPageClient } from "./onboarding-page-client"
import { getUserOrganization } from "@/lib/actions/setup"
import { requireAuth } from "@/lib/auth/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "concierge" })
  
  return {
    title: locale === "ar" ? "إعداد المتجر" : "Store Setup",
    description: t("welcome.subtitle"),
  }
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Require authentication
  await requireAuth(locale)
  
  // Get user's organization to check onboarding status
  const organization = await getUserOrganization()
  
  // If no organization, redirect to start
  if (!organization) {
    redirect(`/${locale}/start`)
  }
  
  // If onboarding is already completed or skipped, redirect to admin
  const onboardingStatus = organization.onboardingCompleted || "not_started"
  if (onboardingStatus === "completed" || onboardingStatus === "skipped") {
    redirect(`/${locale}/admin`)
  }
  
  return (
    <OnboardingPageClient 
      locale={locale} 
      initialOnboardingStatus={onboardingStatus}
    />
  )
}
