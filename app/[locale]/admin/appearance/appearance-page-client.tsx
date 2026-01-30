"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
  Palette,
  Type,
  Image,
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  Check,
  Upload,
  Loader2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { useTranslations } from "next-intl"
import { updateStoreTheme } from "@/lib/actions/theme"
import { useImageUpload } from "@/hooks/use-image-upload"

interface ThemeConfig {
  id: string
  name: string
  description: string
  supportedStoreTypes: ("clothing" | "car_care")[]
}

interface StoreSettings {
  id?: string
  appearance?: {
    primary_color: string
    accent_color: string
    font_family: string
    logo_url: string | null
    favicon_url: string | null
  }
}

interface AppearancePageClientProps {
  initialSettings: StoreSettings | null
  currentThemeId: string | null
  themeConfigs: ThemeConfig[]
  storeId: string
}

const defaultAppearance = {
  primary_color: "#000000",
  accent_color: "#6366f1",
  font_family: "Inter",
  logo_url: null,
  favicon_url: null,
}

const colorPresets = [
  { key: "midnight", name: "midnight", primary: "#000000", accent: "#6366f1" },
  { key: "ocean", name: "ocean", primary: "#0f172a", accent: "#0ea5e9" },
  { key: "forest", name: "forest", primary: "#14532d", accent: "#22c55e" },
  { key: "sunset", name: "sunset", primary: "#7c2d12", accent: "#f97316" },
  { key: "rose", name: "rose", primary: "#881337", accent: "#f43f5e" },
  { key: "royal", name: "royal", primary: "#1e1b4b", accent: "#8b5cf6" },
]

const fontOptions = [
  { name: "Inter", value: "Inter" },
  { name: "Poppins", value: "Poppins" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Montserrat", value: "Montserrat" },
]

export function AppearancePageClient({
  initialSettings,
  currentThemeId,
  themeConfigs,
  storeId,
}: AppearancePageClientProps) {
  const t = useTranslations("admin")
  const [appearance, setAppearance] = useState(
    initialSettings?.appearance || defaultAppearance
  )
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(currentThemeId)
  const [savedThemeId, setSavedThemeId] = useState<string | null>(currentThemeId)
  const [themeError, setThemeError] = useState<string | null>(null)
  const [isThemePending, startThemeTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { setPageContext } = useAdminAssistant()
  const { uploadFiles, uploading } = useImageUpload({
    storeId,
    productId: "branding",
    maxFiles: 1
  })

  // Set page context for AI assistant
  useEffect(() => {
    setPageContext({
      pageName: t("appearancePage.title"),
      pageType: "appearance",
      selectedItems: [],
      filters: {},
      capabilities: [
        t("appearancePage.capabilities.colorSchemes"),
        t("appearancePage.capabilities.fonts"),
        t("appearancePage.capabilities.brandPalette"),
        t("appearancePage.capabilities.preview"),
      ],
    })
  }, [setPageContext, t])

  // Track changes
  useEffect(() => {
    const original = initialSettings?.appearance || defaultAppearance
    const changed =
      appearance.primary_color !== original.primary_color ||
      appearance.accent_color !== original.accent_color ||
      appearance.font_family !== original.font_family ||
      appearance.logo_url !== original.logo_url

    setHasChanges(changed)
  }, [appearance, initialSettings])

  useEffect(() => {
    setSelectedThemeId(currentThemeId)
    setSavedThemeId(currentThemeId)
  }, [currentThemeId])

  const selectedTheme = themeConfigs.find((theme) => theme.id === selectedThemeId) || null
  const savedTheme = themeConfigs.find((theme) => theme.id === savedThemeId) || null

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("store_settings")
        .upsert({
          merchant_id: user.id,
          appearance,
        })

      if (error) throw error

      setHasChanges(false)
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setAppearance(initialSettings?.appearance || defaultAppearance)
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setAppearance((prev) => ({
      ...prev,
      primary_color: preset.primary,
      accent_color: preset.accent,
    }))
  }

  const handleThemeSave = () => {
    if (!selectedThemeId || selectedThemeId === savedThemeId) return

    setThemeError(null)
    startThemeTransition(async () => {
      const result = await updateStoreTheme(selectedThemeId)
      if (!result.success) {
        setThemeError(result.error)
        return
      }

      setSavedThemeId(result.themeId)
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const urls = await uploadFiles([file])
      if (urls.length > 0) {
        setAppearance(prev => ({ ...prev, logo_url: urls[0] }))
      }
    } catch (error) {
      console.error("Upload failed", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("appearancePage.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("appearancePage.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("appearancePage.reset")}
              </Button>
            )}
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
              {t("appearancePage.saveChanges")}
            </Button>
          </div>
        </div>

        {/* AI Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("appearancePage.aiSuggestion.title")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("appearancePage.aiSuggestion.subtitle")}
              </p>
            </div>
          </div>
        </motion.div>

         {/* Branding / Logo */}
         <div className="rounded-xl border bg-card p-6">
           <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("appearancePage.branding")}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("appearancePage.logo")}</label>
              <div className="flex items-center gap-4">
                {appearance.logo_url ? (
                  <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted/20">
                    <img src={appearance.logo_url} alt="Store Logo" className="w-full h-full object-contain" />
                    <button 
                       onClick={() => setAppearance(prev => ({ ...prev, logo_url: null }))}
                       className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/10 text-muted-foreground">
                    <span className="text-xs">No Logo</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t("appearancePage.uploadLogo")}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: 512x512px transparent PNG
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("appearancePage.theme.title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("appearancePage.theme.subtitle")}
          </p>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t("appearancePage.theme.label")}
              </label>
              <select
                value={selectedThemeId ?? ""}
                onChange={(e) => setSelectedThemeId(e.target.value || null)}
                className="w-full px-4 py-2 rounded-xl border bg-background"
              >
                <option value="" disabled>
                  {t("appearancePage.theme.placeholder")}
                </option>
                {themeConfigs.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              {selectedTheme && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedTheme.description || t("appearancePage.theme.noDescription")}
                </p>
              )}
            </div>
            <Button
              onClick={handleThemeSave}
              disabled={!selectedThemeId || selectedThemeId === savedThemeId || isThemePending}
              variant="outline"
              className="h-11"
            >
              {isThemePending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t("appearancePage.theme.save")}
            </Button>
          </div>
          {savedTheme && (
            <p className="text-xs text-muted-foreground mt-3">
              {t("appearancePage.theme.current", { theme: savedTheme.name })}
            </p>
          )}
          {themeError && (
            <p className="text-xs text-red-500 mt-2">{themeError}</p>
          )}
        </div>

        {/* Color Presets */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("appearancePage.colorPresets")}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colorPresets.map((preset) => {
              const isActive =
                appearance.primary_color === preset.primary &&
                appearance.accent_color === preset.accent

              return (
                <button
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isActive
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-muted-foreground/40"
                  )}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {t(`appearancePage.presets.${preset.key}`)}
                  </span>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary absolute right-2" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">{t("appearancePage.customColors")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t("appearancePage.primaryColor")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={appearance.primary_color}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      primary_color: e.target.value,
                    }))
                  }
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                />
                <input
                  type="text"
                  value={appearance.primary_color}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      primary_color: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border bg-background text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t("appearancePage.accentColor")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={appearance.accent_color}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      accent_color: e.target.value,
                    }))
                  }
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                />
                <input
                  type="text"
                  value={appearance.accent_color}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      accent_color: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border bg-background text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("appearancePage.typography")}</h3>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {t("appearancePage.fontFamily")}
            </label>
            <select
              value={appearance.font_family}
              onChange={(e) =>
                setAppearance((prev) => ({
                  ...prev,
                  font_family: e.target.value,
                }))
              }
              className="w-full sm:w-auto px-4 py-2 rounded-xl border bg-background"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("appearancePage.preview")}</h3>
          </div>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: appearance.primary_color,
              fontFamily: appearance.font_family,
            }}
          >
            <h4
              className="text-xl font-bold mb-2"
              style={{ color: appearance.accent_color }}
            >
              {t("appearancePage.previewTitle")}
            </h4>
            <p className="text-white/80 mb-4">
              {t("appearancePage.previewSubtitle")}
            </p>
            <button
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: appearance.accent_color,
                color: appearance.primary_color,
              }}
            >
              {t("appearancePage.previewButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
