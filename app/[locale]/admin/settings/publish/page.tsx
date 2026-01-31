import { getTranslations } from "next-intl/server"
import { Rocket, CheckCircle2, XCircle, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublishingActions } from "@/components/admin/settings/publishing-actions"
import { validateStoreForPublishing, createPreviewToken } from "@/lib/actions/store-lifecycle"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { CopyButton } from "./copy-button"

export const dynamic = "force-dynamic"

export default async function PublishingPage() {
  const t = await getTranslations("admin.publishingPage")

  // Fetch store status and check requirements
  const context = await getAdminStoreContext()
  const validation = await validateStoreForPublishing()
  const previewTokenResult = await createPreviewToken()

  const storeStatus = (context?.store.status === "active" || context?.store.status === "draft")
    ? context.store.status
    : "draft"
  const requirements = {
    hasActiveProducts: !validation.missing.includes("active_products"),
    hasStoreName: !validation.missing.includes("store_name"),
    hasStoreType: !validation.missing.includes("store_type"),
  }

  const allRequirementsMet = validation.valid
  const previewUrl = previewTokenResult.success
    ? `${process.env.NEXT_PUBLIC_APP_URL}/preview?token=${previewTokenResult.token}`
    : null

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("status.title")}</span>
            <Badge variant={storeStatus === "active" ? "default" : "secondary"}>
              {storeStatus === "active" ? t("status.active") : t("status.draft")}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>{t("requirements.title")}</CardTitle>
          <CardDescription>
            {allRequirementsMet
              ? "All requirements met! You can publish your store."
              : "Complete these requirements to publish your store"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <RequirementItem
              met={requirements.hasActiveProducts}
              label={t("requirements.atLeastOneProduct")}
            />
            <RequirementItem met={requirements.hasStoreName} label={t("requirements.storeNameSet")} />
            <RequirementItem met={requirements.hasStoreType} label="Store type is configured" />
          </div>
        </CardContent>
      </Card>

      {/* Publishing Actions */}
      <PublishingActions
        storeStatus={storeStatus}
        canPublish={allRequirementsMet}
      />

      {/* Preview Section */}
      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              {t("preview.title")}
            </CardTitle>
            <CardDescription>{t("preview.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded text-sm overflow-x-auto">
                {previewUrl}
              </code>
              <CopyButton text={previewUrl} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Preview link expires in 24 hours
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {met ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  )
}
