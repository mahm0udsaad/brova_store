import { getTranslations } from "next-intl/server"
import { Rocket, CheckCircle2, XCircle, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PublishingActionsConnected } from "@/components/admin/settings/publishing-actions-connected"
import { validateStoreForPublishing, createPreviewToken } from "@/lib/actions/store-lifecycle"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"

export const dynamic = "force-dynamic"

export default async function PublishingPageConnected() {
  const t = await getTranslations("admin.publishingPage")
  const storeContext = await getAdminStoreContext()

  if (!storeContext) {
    return <div>No store found</div>
  }

  const validation = await validateStoreForPublishing()
  const storeStatus = storeContext.store.status as "draft" | "active"

  const requirements = {
    hasActiveProducts: !validation.missing.includes("active_products"),
    hasStoreName: !validation.missing.includes("store_name"),
    hasContactInfo: true, // TODO: Check contact info
    hasLogo: true, // TODO: Check logo
  }

  const allRequirementsMet = validation.valid

  // Generate preview token
  const tokenResult = await createPreviewToken()
  const previewToken = tokenResult.success ? tokenResult.token : null

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
            <RequirementItem
              met={requirements.hasContactInfo}
              label={t("requirements.contactInfoComplete")}
            />
            <RequirementItem met={requirements.hasLogo} label={t("requirements.logoUploaded")} />
          </div>
        </CardContent>
      </Card>

      {/* Publishing Actions */}
      <PublishingActionsConnected
        storeStatus={storeStatus}
        canPublish={allRequirementsMet}
      />

      {/* Preview Section */}
      {previewToken && (
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
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                {typeof window !== "undefined" && `${window.location.origin}?preview=${previewToken}`}
              </code>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
