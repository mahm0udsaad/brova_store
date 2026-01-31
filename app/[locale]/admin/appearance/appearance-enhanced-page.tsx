import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { getThemeConfig } from "@/lib/actions/theme"
import { createPreviewToken } from "@/lib/actions/store-lifecycle"
import { ThemeEditorTabs } from "@/components/admin/theme-editor/theme-editor-tabs"

export const metadata = {
  title: "Theme Editor",
  description: "Customize your store's appearance",
}

export const dynamic = "force-dynamic"

export default async function AppearanceEnhancedPage() {
  const storeContext = await getAdminStoreContext()

  if (!storeContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No store found</p>
      </div>
    )
  }

  // Fetch theme config
  const themeConfig = await getThemeConfig()

  // Generate preview token
  const tokenResult = await createPreviewToken()
  const previewToken = tokenResult.success ? tokenResult.token : undefined

  return (
    <div className="p-6">
      <ThemeEditorTabs
        initialConfig={themeConfig}
        storeId={storeContext.store.id}
        previewToken={previewToken}
      />
    </div>
  )
}
