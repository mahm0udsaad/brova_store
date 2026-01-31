import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { getTranslations } from "next-intl/server"
import { getThemeConfig } from "@/lib/actions/theme"
import { createPreviewToken } from "@/lib/actions/store-lifecycle"
import { ThemeEditorTabs } from "@/components/admin/theme-editor/theme-editor-tabs"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin.appearancePage" })

  return {
    title: t("title"),
    description: t("subtitle"),
  }
}

export default async function AppearancePage() {
  const [storeContext, themeConfig, previewTokenResult] = await Promise.all([
    getAdminStoreContext(),
    getThemeConfig(),
    createPreviewToken(),
  ])

  if (!storeContext) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No store found</h2>
          <p className="text-muted-foreground">Please create a store first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <ThemeEditorTabs
        initialConfig={themeConfig}
        storeId={storeContext.store.id}
        previewToken={previewTokenResult.success ? previewTokenResult.token : undefined}
      />
    </div>
  )
}