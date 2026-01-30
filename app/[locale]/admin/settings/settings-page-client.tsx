"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bot,
  Zap,
  Bell,
  Save,
  RefreshCw,
  BarChart3,
  Image,
  Type,
  Camera,
  Layers,
  AlertTriangle,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { useTranslations } from "next-intl"
import { updateStoreContact } from "@/lib/actions/store-contact"

interface StoreSettings {
  id?: string
  // contact_info deprecated, moved to store_contact
  ai_preferences?: {
    auto_generate_descriptions: boolean
    auto_suggest_pricing: boolean
    default_image_style: string
    daily_limits: {
      image_generation: number
      text_tokens: number
      screenshot_analysis: number
      bulk_batches: number
    }
  }
  notifications?: {
    email_on_order: boolean
    sms_on_order: boolean
    ai_task_completion: boolean
  }
}

interface StoreContact {
  id?: string
  store_id?: string
  store_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
}

interface AIUsage {
  id: string
  operation: string
  date: string
  count: number
  tokens_used: number
}

interface SettingsPageClientProps {
  initialSettings: StoreSettings | null
  initialContact: StoreContact | null
  aiUsage: AIUsage[]
}

const defaultSettings: StoreSettings = {
  ai_preferences: {
    auto_generate_descriptions: true,
    auto_suggest_pricing: false,
    default_image_style: "clean",
    daily_limits: {
      image_generation: 100,
      text_tokens: 500000,
      screenshot_analysis: 20,
      bulk_batches: 5,
    },
  },
  notifications: {
    email_on_order: true,
    sms_on_order: false,
    ai_task_completion: true,
  },
}

const defaultContact: StoreContact = {
  store_name: null,
  email: null,
  phone: null,
  address: null,
  country: null
}

export function SettingsPageClient({ initialSettings, initialContact, aiUsage }: SettingsPageClientProps) {
  const t = useTranslations("admin")
  const [settings, setSettings] = useState<StoreSettings>(
    initialSettings || defaultSettings
  )
  const [contact, setContact] = useState<StoreContact>(
    initialContact || defaultContact
  )
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { setPageContext } = useAdminAssistant()

  // Set page context for AI assistant
  useEffect(() => {
    setPageContext({
      pageName: t("settingsPage.title"),
      pageType: "settings",
      selectedItems: [],
      filters: {},
      capabilities: [
        t("settingsPage.capabilities.usage"),
        t("settingsPage.capabilities.explain"),
        t("settingsPage.capabilities.optimize"),
        t("settingsPage.capabilities.quota"),
      ],
    })
  }, [setPageContext, t])

  // Calculate usage statistics
  const usageStats = aiUsage.reduce(
    (acc, u) => {
      if (u.operation.includes("image")) {
        acc.images += u.count
      } else {
        acc.tokens += u.tokens_used
      }
      return acc
    },
    { images: 0, tokens: 0 }
  )

  const limits = settings.ai_preferences?.daily_limits || defaultSettings.ai_preferences!.daily_limits

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // 1. Save Contact Info using Server Action
      await updateStoreContact({
        store_name: contact.store_name || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        address: contact.address || undefined,
        country: contact.country || undefined,
      })

      // 2. Save Store Settings (AI prefs, etc)
      const { error } = await supabase
        .from("store_settings")
        .upsert({
          merchant_id: user.id,
          ai_preferences: settings.ai_preferences,
          notifications: settings.notifications,
        })

      if (error) throw error

      setHasChanges(false)
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateContactInfo = (key: keyof StoreContact, value: string) => {
    setContact((prev) => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
  }

  const updatePreference = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      ai_preferences: {
        ...prev.ai_preferences!,
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  const updateLimit = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      ai_preferences: {
        ...prev.ai_preferences!,
        daily_limits: {
          ...prev.ai_preferences!.daily_limits,
          [key]: value,
        },
      },
    }))
    setHasChanges(true)
  }

  const updateNotification = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("settingsPage.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("settingsPage.subtitle")}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t("settingsPage.saveChanges")}
          </Button>
        </div>

        {/* Store Contact Info */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("settingsPage.storeInfo.title")}</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settingsPage.storeInfo.storeName")}</label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={contact.store_name || ""}
                  onChange={(e) => updateContactInfo("store_name", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm"
                  placeholder="My Store"
                />
              </div>
            </div>
            
             <div className="space-y-2">
              <label className="text-sm font-medium">{t("settingsPage.storeInfo.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => updateContactInfo("email", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm"
                  placeholder="support@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settingsPage.storeInfo.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={contact.phone || ""}
                  onChange={(e) => updateContactInfo("phone", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settingsPage.storeInfo.country")}</label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={contact.country || ""}
                  onChange={(e) => updateContactInfo("country", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm"
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">{t("settingsPage.storeInfo.address")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={contact.address || ""}
                  onChange={(e) => updateContactInfo("address", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm"
                  placeholder="123 Store St, City, State"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("settingsPage.usageThisMonth")}</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <UsageBar
              label={t("settingsPage.imageGeneration")}
              current={usageStats.images}
              limit={limits.image_generation}
              icon={Image}
            />
            <UsageBar
              label={t("settingsPage.textTokens")}
              current={Math.round(usageStats.tokens / 1000)}
              limit={Math.round(limits.text_tokens / 1000)}
              suffix="K"
              icon={Type}
            />
          </div>
        </div>

        {/* AI Preferences */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("settingsPage.aiPreferences")}</h3>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label={t("settingsPage.autoGenerateDescriptions.label")}
              description={t("settingsPage.autoGenerateDescriptions.description")}
              checked={settings.ai_preferences?.auto_generate_descriptions ?? true}
              onChange={(v) => updatePreference("auto_generate_descriptions", v)}
            />

            <ToggleSetting
              label={t("settingsPage.autoSuggestPricing.label")}
              description={t("settingsPage.autoSuggestPricing.description")}
              checked={settings.ai_preferences?.auto_suggest_pricing ?? false}
              onChange={(v) => updatePreference("auto_suggest_pricing", v)}
            />

            <div className="pt-4 border-t">
              <label className="text-sm font-medium">{t("settingsPage.defaultImageStyle.label")}</label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("settingsPage.defaultImageStyle.description")}
              </p>
              <select
                value={settings.ai_preferences?.default_image_style || "clean"}
                onChange={(e) => updatePreference("default_image_style", e.target.value)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border bg-background"
              >
                <option value="clean">{t("settingsPage.defaultImageStyle.options.clean")}</option>
                <option value="lifestyle">{t("settingsPage.defaultImageStyle.options.lifestyle")}</option>
                <option value="studio">{t("settingsPage.defaultImageStyle.options.studio")}</option>
                <option value="urban">{t("settingsPage.defaultImageStyle.options.urban")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Daily Limits */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("settingsPage.dailyLimits.title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("settingsPage.dailyLimits.subtitle")}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <LimitInput
              label={t("settingsPage.imageGeneration")}
              value={limits.image_generation}
              onChange={(v) => updateLimit("image_generation", v)}
              icon={Image}
              suffix={t("settingsPage.dailyLimits.imagesPerDay")}
            />
            <LimitInput
              label={t("settingsPage.textTokens")}
              value={limits.text_tokens}
              onChange={(v) => updateLimit("text_tokens", v)}
              icon={Type}
              suffix={t("settingsPage.dailyLimits.tokensPerDay")}
              step={10000}
            />
            <LimitInput
              label={t("settingsPage.screenshotAnalysis")}
              value={limits.screenshot_analysis}
              onChange={(v) => updateLimit("screenshot_analysis", v)}
              icon={Camera}
              suffix={t("settingsPage.dailyLimits.screenshotsPerDay")}
            />
            <LimitInput
              label={t("settingsPage.bulkBatches")}
              value={limits.bulk_batches}
              onChange={(v) => updateLimit("bulk_batches", v)}
              icon={Layers}
              suffix={t("settingsPage.dailyLimits.batchesPerDay")}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("settingsPage.notifications.title")}</h3>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label={t("settingsPage.notifications.email.label")}
              description={t("settingsPage.notifications.email.description")}
              checked={settings.notifications?.email_on_order ?? true}
              onChange={(v) => updateNotification("email_on_order", v)}
            />

            <ToggleSetting
              label={t("settingsPage.notifications.sms.label")}
              description={t("settingsPage.notifications.sms.description")}
              checked={settings.notifications?.sms_on_order ?? false}
              onChange={(v) => updateNotification("sms_on_order", v)}
            />

            <ToggleSetting
              label={t("settingsPage.notifications.aiCompletion.label")}
              description={t("settingsPage.notifications.aiCompletion.description")}
              checked={settings.notifications?.ai_task_completion ?? true}
              onChange={(v) => updateNotification("ai_task_completion", v)}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-500">{t("settingsPage.dangerZone.title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("settingsPage.dangerZone.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
              {t("settingsPage.dangerZone.clearAiHistory")}
            </Button>
            <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
              {t("settingsPage.dangerZone.deleteGeneratedAssets")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  )
}

function LimitInput({
  label,
  value,
  onChange,
  icon: Icon,
  suffix,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  icon: React.ComponentType<{ className?: string }>
  suffix: string
  step?: number
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={0}
          className="flex-1 px-3 py-2 rounded-xl border bg-background text-sm"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {suffix}
        </span>
      </div>
    </div>
  )
}

function UsageBar({
  label,
  current,
  limit,
  icon: Icon,
  suffix = "",
}: {
  label: string
  current: number
  limit: number
  icon: React.ComponentType<{ className?: string }>
  suffix?: string
}) {
  const percentage = Math.min((current / limit) * 100, 100)
  const isWarning = percentage > 80

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {label}
        </label>
        <span className="text-sm text-muted-foreground">
          {current}{suffix} / {limit}{suffix}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full",
            isWarning
              ? "bg-orange-500"
              : "bg-gradient-to-r from-violet-500 to-purple-600"
          )}
        />
      </div>
    </div>
  )
}
