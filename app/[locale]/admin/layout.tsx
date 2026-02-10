import type { Metadata } from "next"
import { AdminAuthWrapper } from "@/components/admin-auth-wrapper"
import { AdminAssistantProvider } from "@/components/admin-assistant/AdminAssistantProvider"
import { AdminShell } from "@/components/admin/AdminShell"
import { ConciergeGate } from "@/components/admin-concierge/ConciergeGate"
import { getTranslations } from "next-intl/server"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })

  const context = await getAdminStoreContext()
  const storeName = context?.store.name || "Store"

  return {
    title: {
      default: `Admin Panel | ${storeName}`,
      template: `%s | ${storeName} Admin`,
    },
    description: t("metadataDescription"),
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminStoreContext()
  const storeName = context?.store.name
  const storeStatus = context?.store.status || "draft"
  const storeSlug = context?.store.slug || ""

  return (
    <div className="dark theme-admin-ai min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <AdminAuthWrapper>
        <AdminAssistantProvider>
          <ConciergeGate>
            <AdminShell storeName={storeName} storeStatus={storeStatus} storeSlug={storeSlug}>
              {children}
            </AdminShell>
          </ConciergeGate>
        </AdminAssistantProvider>
      </AdminAuthWrapper>
    </div>
  )
}
