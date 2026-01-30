import type { Metadata } from "next"
import { AdminAuthWrapper } from "@/components/admin-auth-wrapper"
import { AdminAssistantProvider } from "@/components/admin-assistant/AdminAssistantProvider"
import { AdminShell } from "@/components/admin/AdminShell"
import { ConciergeGate } from "@/components/admin-concierge/ConciergeGate"
import { getTranslations } from "next-intl/server"
import { resolveTenant } from "@/lib/tenant-resolver"
import { getStorefrontContext } from "@/lib/supabase/queries/storefront"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  
  const tenantSlug = await resolveTenant()
  const context = await getStorefrontContext(tenantSlug)
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
  const tenantSlug = await resolveTenant()
  const context = await getStorefrontContext(tenantSlug)
  const storeName = context?.store.name
  const storeStatus = context?.store.status || "draft"
  const storeSlug = context?.store.slug || ""

  return (
    <AdminAuthWrapper>
      <AdminAssistantProvider>
        <ConciergeGate>
          <AdminShell storeName={storeName} storeStatus={storeStatus} storeSlug={storeSlug}>
            {children}
          </AdminShell>
        </ConciergeGate>
      </AdminAssistantProvider>
    </AdminAuthWrapper>
  )
}
