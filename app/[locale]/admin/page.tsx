import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { getDashboardStats } from "@/lib/supabase/queries/admin-dashboard"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { BilingualWelcomeSection } from "@/components/admin/dashboard/welcome-section"
import { SkeletonStats } from "@/components/ui/skeleton"
import { DashboardContentClient } from "./dashboard-content-client"

// Force dynamic rendering and set revalidation
export const dynamic = "force-dynamic"
export const revalidate = 30 // Revalidate every 30 seconds

// =============================================================================
// COMPONENTS
// =============================================================================

async function DashboardContent({
  locale,
  t,
}: {
  locale: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  const stats = await getDashboardStats()

  // Prepare translations for client component
  const translations = {
    overview: t("dashboard.overview"),
    quickActions: t("dashboard.quickActions"),
    totalOrders: t("dashboardStats.totalOrders"),
    pending: t("dashboardStats.pending"),
    totalProducts: t("dashboardStats.totalProducts"),
    active: t("dashboardStats.active"),
    totalUsers: t("dashboardStats.totalUsers"),
    registeredProfiles: t("dashboardStats.registeredProfiles"),
    tryOnUsage: t("dashboardStats.tryOnUsage"),
    totalHistoryEvents: t("dashboardStats.totalHistoryEvents"),
    addProduct: t("dashboard.actions.addProduct"),
    addProductDesc: t("dashboard.actions.addProductDesc"),
    manageOrders: t("dashboard.actions.manageOrders"),
    manageOrdersDesc: t("dashboard.actions.manageOrdersDesc"),
    mediaLibrary: t("dashboard.actions.mediaLibrary"),
    mediaLibraryDesc: t("dashboard.actions.mediaLibraryDesc"),
    marketing: t("dashboard.actions.marketing"),
    marketingDesc: t("dashboard.actions.marketingDesc"),
    new: t("dashboard.actions.new"),
  }

  // Transform stats to match client component expectations
  const transformedStats = {
    totalProducts: stats.products.total,
    activeProducts: stats.products.active,
    draftProducts: stats.products.draft,
    totalUsers: stats.customers.total,
    tryOnUsage: 0, // Not in new stats, keep for compatibility
    totalOrders: stats.orders.total,
    pendingOrders: stats.orders.pending,
    deliveredOrders: stats.orders.completed,
  }

  return (
    <DashboardContentClient
      stats={transformedStats}
      locale={locale}
      translations={translations}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Status Banner Skeleton */}
      <div className="rounded-xl border border-border bg-muted/50 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-muted rounded-full" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <section>
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStats key={i} shimmer />
          ))}
        </div>
      </section>

      {/* Actions Skeleton */}
      <section>
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// PAGE
// =============================================================================

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })

  // Get user's store context (auth-scoped)
  const storeContext = await getAdminStoreContext()

  // If onboarding not completed, redirect to onboarding
  const onboardingStatus = storeContext?.store.onboarding_completed
  if (storeContext && onboardingStatus !== 'completed' && onboardingStatus !== 'skipped') {
    redirect(`/${locale}/admin/onboarding`)
  }

  // If no store context, show setup prompt
  if (!storeContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">
            {t("storeMissing.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("storeMissing.subtitle")}
          </p>
        </div>
      </div>
    )
  }

  // Use store name from context, fallback to type if name not set
  const storeName = storeContext.store.name ||
    (storeContext.store.type === "clothing"
      ? t("storeTypes.clothing")
      : t("storeTypes.carCare")
    )

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Section */}
        <BilingualWelcomeSection
          storeName={storeName}
          locale={locale}
        />

        {/* Store Status Banner */}
        {storeContext.store.status === "draft" && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-amber-500">
                {t("storeStatus.draft")}
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent locale={locale} t={t} />
      </Suspense>
      </div>
    </div>
  )
}
