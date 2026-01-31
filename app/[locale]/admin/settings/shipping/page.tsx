import { getTranslations } from "next-intl/server"
import { Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShippingSettingsForm } from "@/components/admin/settings/shipping-settings-form"
import { getShippingSettings } from "@/lib/actions/shipping"

export const dynamic = "force-dynamic"

export default async function ShippingSettingsPage() {
  const t = await getTranslations("admin.shippingPage")

  // Fetch shipping settings from store_settings.shipping
  const shippingSettings = await getShippingSettings()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Shipping Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ShippingSettingsForm initialSettings={shippingSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
