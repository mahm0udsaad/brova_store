"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductSelectionModal } from "./product-selection-modal"
import { GeneratorConfig } from "./marketing/generator-config"
import { GenerationProgress } from "./marketing/generation-progress"
import { GeneratedPosts } from "./marketing/generated-posts"
import { SavedDrafts } from "./marketing/saved-drafts"
import { cn } from "@/lib/utils"
import { buildMarketingDrafts } from "@/lib/marketing/post-ui"
import { useTranslations } from "next-intl"

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
  category_id: string | null
  description?: string
}

interface InlineMarketingGeneratorProps {
  products: Product[]
}

interface SavedDraft {
  id: string
  platform: string
  ui_structure: any
  media_assets: any
  copy_text: any
  status: string
  created_at: string
}

export function InlineMarketingGenerator({ products }: InlineMarketingGeneratorProps) {
  const t = useTranslations("admin")
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [campaignGoal, setCampaignGoal] = useState("")
  const [tone, setTone] = useState("casual")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<"analyzing" | "generating" | "complete">("analyzing")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [generatedPosts, setGeneratedPosts] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSavingDrafts, setIsSavingDrafts] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true)

  const selectedProductData = products.filter((p) => selectedProducts.includes(p.id))

  // Load saved drafts on mount and when requested
  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true)
      const response = await fetch("/api/admin/marketing-drafts", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(t("marketingGenerator.errors.loadDrafts"))
      }

      const data = await response.json()
      setSavedDrafts(data.drafts || [])
    } catch (error) {
      console.error("Failed to load drafts:", error)
    } finally {
      setIsLoadingDrafts(false)
    }
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  // Listen for external refresh requests (e.g., from AI assistant)
  useEffect(() => {
    const handleRefresh = () => {
      console.log("Refreshing marketing drafts...")
      loadDrafts()
    }

    window.addEventListener("marketing-refresh-drafts", handleRefresh)

    return () => {
      window.removeEventListener("marketing-refresh-drafts", handleRefresh)
    }
  }, [])

  // Auto-sync images with selected products
  useEffect(() => {
    const imageUrls = selectedProductData
      .map((p) => p.image_url)
      .filter((url): url is string => url !== null)
    setSelectedImages(imageUrls)
  }, [selectedProducts])

  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      setError(t("marketingGenerator.errors.selectProduct"))
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedPosts(null)
    setGenerationStage("analyzing")
    setGenerationProgress(0)
    setActivePlatform(null)

    try {
      const productNames = selectedProductData.map(p => p.name).join(", ")
      const message = campaignGoal
        ? `Generate social media posts for these products: ${productNames}. Campaign goal: ${campaignGoal}. Tone: ${tone}.`
        : `Generate social media posts for these products: ${productNames}. Tone: ${tone}.`

      // Animate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev < 30) return prev + 12
          if (prev < 75) {
            setGenerationStage("generating")
            if (prev < 40) setActivePlatform("facebook")
            else if (prev < 60) setActivePlatform("instagram")
            else setActivePlatform("tiktok")
            return prev + 8
          }
          if (prev < 90) return prev + 3
          return prev
        })
      }, 400)

      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          pageContext: {
            pageName: "Marketing",
            pageType: "marketing",
            selectedItems: selectedProducts,
            filters: { tone, campaignGoal },
            capabilities: ["generate_social_posts"],
            availableImages: selectedImages,
            contextData: {
              products: selectedProductData.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description || "",
                price: p.price || 0,
                category: p.category_id || "",
              })),
              imageUrls: selectedImages,
              tone,
              campaignGoal: campaignGoal || undefined,
            },
          },
        }),
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStage("complete")
      setActivePlatform(null)

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || t("marketingGenerator.errors.generatePosts"))

      const marketingTask = data.tasks?.find(
        (t: any) => t.agent === "marketer" && t.taskType === "generate_social_posts"
      )

      if (marketingTask?.output) {
        setGeneratedPosts(marketingTask.output)
        try {
          setIsSavingDrafts(true)
          const drafts = buildMarketingDrafts(marketingTask.output, selectedImages, {
            name: "Store Name",
            handle: "store",
            avatarUrl: "/placeholder-logo.svg",
          })
          const draftResponse = await fetch("/api/admin/marketing-drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              drafts,
              context: {
                tone,
                campaignGoal: campaignGoal || null,
                products: selectedProductData.map((p) => ({ id: p.id, name: p.name })),
              },
            }),
          })

          if (!draftResponse.ok) {
            const draftData = await draftResponse.json().catch(() => ({}))
            throw new Error(draftData.error || t("marketingGenerator.errors.saveDrafts"))
          }

          // Reload drafts after saving
          const loadResponse = await fetch("/api/admin/marketing-drafts", {
            method: "GET",
            credentials: "include",
          })
          if (loadResponse.ok) {
            const loadData = await loadResponse.json()
            setSavedDrafts(loadData.drafts || [])
          }
        } catch (draftError) {
          console.error("Draft save error:", draftError)
          setError(t("marketingGenerator.errors.generatedButNotSaved"))
        } finally {
          setIsSavingDrafts(false)
        }
      } else {
        throw new Error(t("marketingGenerator.errors.noPosts"))
      }

      setTimeout(() => setIsGenerating(false), 1000)
    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : t("marketingGenerator.errors.generatePosts"))
      setIsGenerating(false)
      setGenerationStage("analyzing")
      setActivePlatform(null)
    }
  }

  const handleReset = () => {
    setGeneratedPosts(null)
    setGenerationProgress(0)
    setGenerationStage("analyzing")
    setActivePlatform(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Configuration Card */}
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t("marketingGenerator.header.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("marketingGenerator.header.subtitle")}
              </p>
            </div>
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-gradient-to-br from-violet-500 to-purple-600"
            )}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          <GeneratorConfig
            products={products}
            selectedProducts={selectedProducts}
            campaignGoal={campaignGoal}
            tone={tone}
            onProductsChange={setSelectedProducts}
            onCampaignGoalChange={setCampaignGoal}
            onToneChange={setTone}
            onOpenProductSelector={() => setShowProductModal(true)}
          />

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {isSavingDrafts && (
            <div className="text-sm text-muted-foreground">
              {t("marketingGenerator.savingDrafts")}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedProducts.length === 0}
            className="w-full h-12 text-base bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("marketingGenerator.generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t("marketingGenerator.generate")}
              </>
            )}
          </Button>
        </div>

        {/* Progress Display */}
        <AnimatePresence>
          {isGenerating && (
            <GenerationProgress
              stage={generationStage}
              progress={generationProgress}
              selectedImages={selectedImages}
              activePlatform={activePlatform}
            />
          )}
        </AnimatePresence>

        {/* Results Display */}
        {generatedPosts && (
          <GeneratedPosts
            posts={generatedPosts}
            mediaUrls={selectedImages}
            onGenerateNew={handleReset}
          />
        )}

        {/* Saved Drafts */}
        {savedDrafts.length > 0 && (
          <SavedDrafts
            drafts={savedDrafts}
            isLoading={isLoadingDrafts}
            onRefresh={loadDrafts}
          />
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <ProductSelectionModal
            products={products}
            selectedProducts={selectedProducts}
            onSelectionChange={setSelectedProducts}
            onClose={() => setShowProductModal(false)}
            onConfirm={() => setShowProductModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
