"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Package,
  Target,
  Wand2,
  Facebook,
  Instagram,
  Copy,
  Check,
  Loader2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MarketingGenerationIndicator } from "./marketing-generation-indicator"

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
  category_id: string | null
  description?: string
}

interface MarketingPostGeneratorProps {
  products: Product[]
  onClose: () => void
}

const toneOptions = [
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "playful", label: "Playful", emoji: "🎉" },
  { value: "luxurious", label: "Luxurious", emoji: "✨" },
  { value: "edgy", label: "Edgy", emoji: "🔥" },
]

const platformConfig = {
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    name: "Facebook",
  },
  instagram: {
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800",
    name: "Instagram",
  },
  tiktok: {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    color: "text-black dark:text-white",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    name: "TikTok",
  },
}

export function MarketingPostGenerator({ products, onClose }: MarketingPostGeneratorProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [campaignGoal, setCampaignGoal] = useState("")
  const [tone, setTone] = useState<"casual" | "professional" | "playful" | "luxurious" | "edgy">("casual")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<"analyzing" | "generating" | "complete">("analyzing")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedPosts, setGeneratedPosts] = useState<any>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-select first product and its image
  useEffect(() => {
    if (products.length > 0 && selectedProducts.length === 0) {
      const firstProduct = products[0]
      setSelectedProducts([firstProduct.id])
      if (firstProduct.image_url) {
        setSelectedImages([firstProduct.image_url])
      }
    }
  }, [products, selectedProducts.length])

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )

    // Auto-select/deselect product image
    const product = products.find((p) => p.id === productId)
    if (product?.image_url) {
      setSelectedImages((prev) =>
        prev.includes(product.image_url!)
          ? prev.filter((url) => url !== product.image_url)
          : [...prev, product.image_url!]
      )
    }
  }

  const toggleImage = (imageUrl: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
    )
  }

  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product")
      return
    }

    if (selectedImages.length === 0) {
      setError("Please select at least one image")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedPosts(null)
    setGenerationStage("analyzing")
    setGenerationProgress(0)

    try {
      const selectedProductData = products
        .filter((p) => selectedProducts.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price || 0,
          category: p.category_id || "",
        }))

      // Build the request message for the AI Manager
      const productNames = selectedProductData.map(p => p.name).join(", ")
      const message = campaignGoal
        ? `Generate social media posts for these products: ${productNames}. Campaign goal: ${campaignGoal}. Tone: ${tone}.`
        : `Generate social media posts for these products: ${productNames}. Tone: ${tone}.`

      // Simulate progress updates with realistic timing
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          // Analyzing phase: 0-30% (faster)
          if (prev < 30) {
            return prev + 12
          }
          // Generating phase: 30-75% (moderate)
          if (prev < 75) {
            setGenerationStage("generating")
            return prev + 8
          }
          // Finishing phase: 75-90% (slower)
          if (prev < 90) {
            return prev + 3
          }
          return prev
        })
      }, 400)

      // Call through the AI Manager (orchestrator) instead of direct API
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          pageContext: {
            pageName: "Marketing",
            pageType: "marketing",
            selectedItems: selectedProducts,
            filters: { tone, campaignGoal },
            capabilities: ["generate_social_posts"],
            availableImages: selectedImages,
            contextData: {
              products: selectedProductData,
              imageUrls: selectedImages,
              tone,
              campaignGoal: campaignGoal || undefined,
            },
          },
        }),
      })

      clearInterval(progressInterval)
      setGenerationProgress(95)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to generate posts")
      }

      setGenerationProgress(100)
      setGenerationStage("complete")

      // Extract the generated posts from the agent task results
      const marketingTask = data.tasks?.find(
        (t: any) => t.agent === "marketer" && t.taskType === "generate_social_posts"
      )

      if (marketingTask && marketingTask.output) {
        setGeneratedPosts(marketingTask.output)
      } else {
        throw new Error("No marketing posts generated")
      }

      // Show completion for a moment before hiding indicator
      setTimeout(() => {
        setIsGenerating(false)
      }, 1000)
    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate posts")
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatPostForCopy = (platform: string, post: any) => {
    const hashtags = Array.isArray(post.hashtags) 
      ? post.hashtags.map((h: string) => `#${h}`).join(" ")
      : ""
    return `${post.caption}\n\n${hashtags}\n\n${post.cta}`
  }

  return (
    <>
      {/* Global Generation Indicator */}
      <MarketingGenerationIndicator
        isGenerating={isGenerating}
        stage={generationStage}
        progress={generationProgress}
        products={products.filter((p) => selectedProducts.includes(p.id))}
        selectedImages={selectedImages}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-background shadow-2xl"
        >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Marketing Post Generator</h2>
              <p className="text-sm text-muted-foreground">
                Generate platform-specific posts for Facebook, Instagram & TikTok
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {!generatedPosts ? (
            // Input Form
            <div className="p-6 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Package className="w-4 h-4" />
                  Select Products ({selectedProducts.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                  {products.map((product) => {
                    const isSelected = selectedProducts.includes(product.id)
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={cn(
                          "relative rounded-lg border-2 p-2 transition-all hover:scale-105",
                          isSelected
                            ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full aspect-square object-cover rounded-md mb-2"
                          />
                        )}
                        <p className="text-xs font-medium truncate">{product.name}</p>
                        {product.price && (
                          <p className="text-xs text-muted-foreground">${product.price}</p>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-violet-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <ImageIcon className="w-4 h-4" />
                  Selected Images ({selectedImages.length})
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
                  {selectedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Selected ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border-2 border-violet-500"
                      />
                      <button
                        onClick={() => toggleImage(url)}
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign Goal */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Target className="w-4 h-4" />
                  Campaign Goal (Optional)
                </label>
                <input
                  type="text"
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  placeholder="e.g., Drive traffic to new collection, Increase brand awareness..."
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Tone Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Wand2 className="w-4 h-4" />
                  Content Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 transition-all",
                        tone === option.value
                          ? "border-violet-500 bg-violet-500/10 font-semibold"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <span className="mr-2">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedProducts.length === 0 || selectedImages.length === 0}
                className="w-full h-12 text-base bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Posts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Posts
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Generated Results
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generated Posts</h3>
                <Button
                  onClick={() => setGeneratedPosts(null)}
                  variant="outline"
                  size="sm"
                >
                  Generate New
                </Button>
              </div>

              {/* Platform Posts */}
              {Object.entries(generatedPosts).map(([platform, post]: [string, any]) => {
                const config = platformConfig[platform as keyof typeof platformConfig]
                if (!config) return null
                
                const PlatformIcon = config.icon
                const isCopied = copiedPlatform === platform

                return (
                  <motion.div
                    key={platform}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl border-2 p-5 space-y-4",
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    {/* Platform Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-background", config.color)}>
                          <PlatformIcon />
                        </div>
                        <div>
                          <h4 className="font-semibold">{config.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Best time: {post.suggestedTime}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(formatPostForCopy(platform, post), platform)}
                        variant="outline"
                        size="sm"
                        className={isCopied ? "bg-green-500/10 border-green-500 text-green-600" : ""}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Caption */}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Caption</p>
                      <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(post.hashtags) && post.hashtags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-background border"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Call to Action</p>
                      <p className="text-sm font-semibold">{post.cta}</p>
                    </div>

                    {/* Tips */}
                    {post.tips && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">{post.tips}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
      </div>
    </>
  )
}
