"use client"

import { useState, useCallback, useMemo, useTransition, lazy, Suspense } from "react"
import { useTranslations } from "next-intl"
import { Save, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ColorsSectionEditor } from "./colors-section-editor"
import { HeroSectionEditor } from "./hero-section-editor"
import { LayoutSectionEditor } from "./layout-section-editor"
import { FooterSectionEditor } from "./footer-section-editor"
import { BannersManager } from "./banners-manager"
import { updateThemeConfig, type ThemeConfig, getBanners } from "@/lib/actions/theme"

const LivePreview = lazy(() =>
  import("./live-preview").then((m) => ({ default: m.LivePreview }))
)

interface ThemeEditorTabsProps {
  initialConfig: ThemeConfig | null
  storeId: string
  previewToken?: string
}

const defaultConfig: ThemeConfig = {
  branding: {
    logo_url: null,
    favicon_url: null,
    store_name: null,
    tagline: null,
    tagline_ar: null,
  },
  colors: {
    primary: "#000000",
    secondary: "#6B7280",
    accent: "#6366f1",
    background: "#FFFFFF",
    text: "#111827",
  },
  hero: {
    enabled: false,
    image_url: null,
    title: "",
    title_ar: "",
    subtitle: "",
    subtitle_ar: "",
    cta_text: "",
    cta_text_ar: "",
    cta_link: "",
  },
  layout: {
    products_per_row: 4,
    show_categories: true,
    show_featured: true,
    show_new_arrivals: true,
    header_style: "sticky",
  },
  footer: {
    about_text: "",
    about_text_ar: "",
    social_links: {
      instagram: "",
      facebook: "",
      twitter: "",
      whatsapp: "",
      tiktok: "",
    },
  },
}

export function ThemeEditorTabs({ initialConfig, storeId, previewToken }: ThemeEditorTabsProps) {
  const t = useTranslations("admin.themeEditor")
  const { toast } = useToast()
  const resolvedInitial = initialConfig || defaultConfig
  const [config, setConfig] = useState<ThemeConfig>(resolvedInitial)
  const [isPending, startTransition] = useTransition()
  const [banners, setBanners] = useState<any[]>([])
  const [bannersLoaded, setBannersLoaded] = useState(false)

  // Derive hasChanges without JSON.stringify on every render
  const hasChanges = useMemo(() => {
    const a = config
    const b = resolvedInitial
    return (
      a.colors?.primary !== b.colors?.primary ||
      a.colors?.secondary !== b.colors?.secondary ||
      a.colors?.accent !== b.colors?.accent ||
      a.colors?.background !== b.colors?.background ||
      a.colors?.text !== b.colors?.text ||
      a.hero?.enabled !== b.hero?.enabled ||
      a.hero?.image_url !== b.hero?.image_url ||
      a.hero?.title !== b.hero?.title ||
      a.hero?.title_ar !== b.hero?.title_ar ||
      a.hero?.subtitle !== b.hero?.subtitle ||
      a.hero?.subtitle_ar !== b.hero?.subtitle_ar ||
      a.hero?.cta_text !== b.hero?.cta_text ||
      a.hero?.cta_text_ar !== b.hero?.cta_text_ar ||
      a.hero?.cta_link !== b.hero?.cta_link ||
      JSON.stringify(a.layout) !== JSON.stringify(b.layout) ||
      JSON.stringify(a.footer) !== JSON.stringify(b.footer) ||
      JSON.stringify(a.branding) !== JSON.stringify(b.branding)
    )
  }, [config, resolvedInitial])

  // Fetch banners lazily when tab is first accessed
  const ensureBannersLoaded = useCallback(async () => {
    if (bannersLoaded) return
    setBannersLoaded(true)
    const data = await getBanners()
    setBanners(data || [])
  }, [bannersLoaded])

  const refreshBanners = useCallback(async () => {
    const data = await getBanners()
    setBanners(data || [])
  }, [])

  // Stable callbacks to avoid re-rendering child editors
  const handleColorsChange = useCallback(
    (colors: ThemeConfig["colors"]) => setConfig((prev) => ({ ...prev, colors })),
    []
  )
  const handleHeroChange = useCallback(
    (hero: ThemeConfig["hero"]) => setConfig((prev) => ({ ...prev, hero })),
    []
  )
  const handleLayoutChange = useCallback(
    (layout: ThemeConfig["layout"]) => setConfig((prev) => ({ ...prev, layout })),
    []
  )
  const handleFooterChange = useCallback(
    (footer: ThemeConfig["footer"]) => setConfig((prev) => ({ ...prev, footer })),
    []
  )

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateThemeConfig(config)
      if (result.success) {
        toast({ title: t("saved") })
      } else {
        toast({ title: t("error"), description: result.error, variant: "destructive" })
      }
    })
  }, [config, toast, t, startTransition])

  const handleReset = useCallback(() => {
    setConfig(resolvedInitial)
  }, [resolvedInitial])

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "banners") {
        ensureBannersLoaded()
      }
    },
    [ensureBannersLoaded]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("save")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="colors" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors">{t("sections.colors")}</TabsTrigger>
          <TabsTrigger value="hero">{t("sections.hero")}</TabsTrigger>
          <TabsTrigger value="banners">{t("sections.banners")}</TabsTrigger>
          <TabsTrigger value="layout">{t("sections.layout")}</TabsTrigger>
          <TabsTrigger value="footer">{t("sections.footer")}</TabsTrigger>
          <TabsTrigger value="preview">{t("preview")}</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ColorsSectionEditor
                colors={config.colors || defaultConfig.colors!}
                onChange={handleColorsChange}
                logoUrl={config.branding?.logo_url}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <HeroSectionEditor
                hero={config.hero || defaultConfig.hero!}
                onChange={handleHeroChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <BannersManager
                banners={banners}
                onUpdate={refreshBanners}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <LayoutSectionEditor
                layout={config.layout || defaultConfig.layout!}
                onChange={handleLayoutChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <FooterSectionEditor
                footer={config.footer || defaultConfig.footer!}
                onChange={handleFooterChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab - lazy loaded */}
        <TabsContent value="preview" className="space-y-4">
          <Suspense
            fallback={
              <Card className="p-4 flex items-center justify-center h-96">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </Card>
            }
          >
            <LivePreview previewToken={previewToken} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
