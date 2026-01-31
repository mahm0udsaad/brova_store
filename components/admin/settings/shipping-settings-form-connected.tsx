"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { updateShippingSettings, type ShippingSettings } from "@/lib/actions/shipping"

interface ShippingSettingsFormConnectedProps {
  initialSettings: ShippingSettings
}

export function ShippingSettingsFormConnected({ initialSettings }: ShippingSettingsFormConnectedProps) {
  const t = useTranslations("admin.shippingPage")
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(initialSettings)

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateShippingSettings(settings)
      if (result.success) {
        toast({
          title: t("saved"),
          description: "Shipping settings have been updated",
        })
      } else {
        toast({
          title: t("error"),
          description: result.error || "Failed to save shipping settings",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Flat Rate Shipping */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="flat-rate-enabled">{t("flatRate.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("flatRate.enabled")}</p>
          </div>
          <Switch
            id="flat-rate-enabled"
            checked={settings.flat_rate_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, flat_rate_enabled: checked })
            }
          />
        </div>

        {settings.flat_rate_enabled && (
          <div className="space-y-2">
            <Label htmlFor="flat-rate-amount">{t("flatRate.amount")}</Label>
            <Input
              id="flat-rate-amount"
              type="number"
              min="0"
              value={settings.flat_rate_amount}
              onChange={(e) =>
                setSettings({ ...settings, flat_rate_amount: Number(e.target.value) })
              }
              placeholder={t("flatRate.amountPlaceholder")}
            />
          </div>
        )}
      </div>

      {/* Free Shipping Threshold */}
      <div className="space-y-2">
        <Label htmlFor="free-shipping">{t("freeShipping.title")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="free-shipping"
            type="number"
            min="0"
            value={settings.free_shipping_threshold || 0}
            onChange={(e) =>
              setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })
            }
            placeholder={t("freeShipping.thresholdPlaceholder")}
          />
          <span className="text-sm text-muted-foreground">EGP</span>
        </div>
      </div>

      {/* Shipping Zones */}
      <div className="space-y-2">
        <Label>{t("zones.title")}</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="egypt"
            checked={settings.shipping_zones.includes("EG")}
            onCheckedChange={(checked) => {
              if (checked) {
                setSettings({ ...settings, shipping_zones: ["EG"] })
              }
            }}
          />
          <label
            htmlFor="egypt"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("zones.egypt")}
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
