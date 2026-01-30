"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Grid3x3,
  Wand2,
  Package,
  Eye,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface UploadedImage {
  url: string
  file?: File
  selected: boolean
}

interface ProductGroup {
  id: string
  name: string
  category: string
  mainImage: string
  images: string[]
  processedImages?: {
    original: string
    background_removed?: string
    lifestyle?: string
    status: "pending" | "processing" | "completed" | "failed"
  }[]
}

interface ProductDetails {
  groupId: string
  name: string
  description: string
  category: string
  price: string
  sizes: string[]
  gender: "men" | "women" | "unisex"
  selectedImages: string[]
}

interface BulkWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  uploadedImages: UploadedImage[]
  onComplete: () => void
}

type WorkflowStep = "preview" | "grouping" | "processing" | "details" | "creating"

const WORKFLOW_STEPS = [
  { id: "preview", title: "Preview Images", icon: Eye },
  { id: "grouping", title: "Group Products", icon: Grid3x3 },
  { id: "processing", title: "AI Processing", icon: Wand2 },
  { id: "details", title: "Product Details", icon: Edit3 },
  { id: "creating", title: "Create Products", icon: Package },
]

export function BulkWorkflowModal({
  isOpen,
  onClose,
  uploadedImages,
  onComplete,
}: BulkWorkflowModalProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("preview")
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>(uploadedImages)
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([])
  const [productDetails, setProductDetails] = useState<ProductDetails[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedImages(uploadedImages.map(img => ({ ...img, selected: true })))
  }, [uploadedImages])

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep)

  const handleNext = async () => {
    setError(null)

    switch (currentStep) {
      case "preview":
        // Move to grouping
        await startGrouping()
        break
      case "grouping":
        // Move to processing
        await startProcessing()
        break
      case "processing":
        // Move to details
        await generateProductDetails()
        break
      case "details":
        // Move to creating
        await createProducts()
        break
      case "creating":
        // Complete
        onComplete()
        onClose()
        break
    }
  }

  const handleBack = () => {
    const steps: WorkflowStep[] = ["preview", "grouping", "processing", "details"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case "preview":
        return selectedImages.filter(img => img.selected).length > 0
      case "grouping":
        return productGroups.length > 0
      case "processing":
        return productGroups.every(g => 
          g.processedImages?.every(img => img.status === "completed")
        )
      case "details":
        return productDetails.every(d => d.name && d.price)
      default:
        return true
    }
  }

  const startGrouping = async () => {
    setIsProcessing(true)
    try {
      const imagesToGroup = selectedImages
        .filter(img => img.selected)
        .map(img => img.url)

      const response = await fetch("/api/admin/bulk-deals/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: imagesToGroup }),
      })

      if (!response.ok) throw new Error("Failed to group images")

      const data = await response.json()
      setProductGroups(data.groups)
      setCurrentStep("grouping")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const startProcessing = async () => {
    setIsProcessing(true)
    setCurrentStep("processing")

    try {
      // Initialize processing status
      const groupsWithStatus = productGroups.map(group => ({
        ...group,
        processedImages: group.images.map(img => ({
          original: img,
          status: "pending" as const,
        })),
      }))
      setProductGroups(groupsWithStatus)

      // Process each group
      for (let i = 0; i < groupsWithStatus.length; i++) {
        const group = groupsWithStatus[i]

        // Update status to processing
        setProductGroups(prev =>
          prev.map((g, idx) =>
            idx === i
              ? {
                  ...g,
                  processedImages: g.processedImages?.map(img => ({
                    ...img,
                    status: "processing" as const,
                  })),
                }
              : g
          )
        )

        // Process images
        const processedImages = await Promise.all(
          group.images.map(async (imageUrl) => {
            try {
              // Remove background
              const bgResponse = await fetch("/api/admin/bulk-deals/ai-edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl, action: "remove_bg" }),
              })

              const bgData = await bgResponse.json()

              // Generate lifestyle
              const lifestyleResponse = await fetch("/api/admin/bulk-deals/ai-edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl, action: "lifestyle" }),
              })

              const lifestyleData = await lifestyleResponse.json()

              return {
                original: imageUrl,
                background_removed: bgData.imageUrl,
                lifestyle: lifestyleData.imageUrl,
                status: "completed" as const,
              }
            } catch (err) {
              return {
                original: imageUrl,
                status: "failed" as const,
              }
            }
          })
        )

        // Update with processed results
        setProductGroups(prev =>
          prev.map((g, idx) =>
            idx === i ? { ...g, processedImages } : g
          )
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateProductDetails = async () => {
    setIsProcessing(true)
    try {
      const details: ProductDetails[] = await Promise.all(
        productGroups.map(async (group) => {
          const response = await fetch("/api/admin/bulk-deals/generate-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ group }),
          })

          const data = await response.json()

          // Collect all images for this product
          const allImages = new Set<string>()
          allImages.add(group.mainImage)
          group.images.forEach(img => allImages.add(img))
          group.processedImages?.forEach(p => {
            if (p.background_removed) allImages.add(p.background_removed)
            if (p.lifestyle) allImages.add(p.lifestyle)
          })

          return {
            groupId: group.id,
            name: data.name || group.name,
            description: data.description || "",
            category: group.category,
            price: "",
            sizes: data.suggestedSizes || ["S", "M", "L", "XL"],
            gender: data.gender || "unisex",
            selectedImages: Array.from(allImages),
          }
        })
      )

      setProductDetails(details)
      setCurrentStep("details")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const createProducts = async () => {
    setIsProcessing(true)
    setCurrentStep("creating")

    try {
      const response = await fetch("/api/admin/bulk-deals/create-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: productDetails,
          groups: productGroups,
        }),
      })

      if (!response.ok) throw new Error("Failed to create products")

      const data = await response.json()
      setBatchId(data.batchId)

      // Wait a moment to show success
      setTimeout(() => {
        onComplete()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl max-h-[90vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Bulk Product Creation</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Follow the steps to create products from your images
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                      isActive && "bg-violet-500/10 text-violet-500",
                      isCompleted && "bg-green-500/10 text-green-500",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {step.title}
                    </span>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentStep === "preview" && (
              <PreviewStep
                images={selectedImages}
                onToggle={(index) => {
                  setSelectedImages(prev =>
                    prev.map((img, i) =>
                      i === index ? { ...img, selected: !img.selected } : img
                    )
                  )
                }}
              />
            )}

            {currentStep === "grouping" && (
              <GroupingStep
                groups={productGroups}
                onUpdateGroups={setProductGroups}
                isLoading={isProcessing}
              />
            )}

            {currentStep === "processing" && (
              <ProcessingStep
                groups={productGroups}
                isProcessing={isProcessing}
              />
            )}

            {currentStep === "details" && (
              <DetailsStep
                details={productDetails}
                groups={productGroups}
                onUpdateDetails={setProductDetails}
              />
            )}

            {currentStep === "creating" && (
              <CreatingStep
                isProcessing={isProcessing}
                productsCount={productDetails.length}
              />
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-500">Error</p>
                <p className="text-sm text-red-500/80">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || isProcessing}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : currentStep === "creating" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  {currentStep === "preview" && "Analyze & Group"}
                  {currentStep === "grouping" && "Process Images"}
                  {currentStep === "processing" && "Generate Details"}
                  {currentStep === "details" && "Create Products"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Step Components

function PreviewStep({
  images,
  onToggle,
}: {
  images: UploadedImage[]
  onToggle: (index: number) => void
}) {
  const selectedCount = images.filter(img => img.selected).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Uploaded Images</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {images.length} images selected
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allSelected = images.every(img => img.selected)
            images.forEach((_, i) => {
              if (allSelected !== images[i].selected) {
                onToggle(i)
              }
            })
          }}
        >
          {images.every(img => img.selected) ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all",
              image.selected
                ? "border-violet-500 ring-4 ring-violet-500/20"
                : "border-muted hover:border-muted-foreground/40"
            )}
            onClick={() => onToggle(index)}
          >
            <img
              src={image.url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Checkbox */}
            <div className="absolute top-2 right-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  image.selected
                    ? "bg-violet-500 text-white"
                    : "bg-white/80 backdrop-blur-sm"
                )}
              >
                {image.selected && <Check className="h-4 w-4" />}
              </div>
            </div>

            {/* Overlay when not selected */}
            {!image.selected && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function GroupingStep({
  groups,
  onUpdateGroups,
  isLoading,
}: {
  groups: ProductGroup[]
  onUpdateGroups: (groups: ProductGroup[]) => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <Loader2 className="h-12 w-12 text-violet-500 animate-spin mb-4" />
        <p className="text-lg font-medium">AI is analyzing your images...</p>
        <p className="text-sm text-muted-foreground">
          Grouping similar products together
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Product Groups</h3>
        <p className="text-sm text-muted-foreground">
          AI has grouped {groups.length} product{groups.length !== 1 ? "s" : ""}.
          You can edit names and adjust grouping.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group, groupIndex) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-start gap-4">
              {/* Main Image */}
              <img
                src={group.mainImage}
                alt={group.name}
                className="w-24 h-24 object-cover rounded-lg border-2 border-violet-500"
              />

              {/* Group Details */}
              <div className="flex-1 space-y-3">
                <Input
                  value={group.name}
                  onChange={(e) => {
                    const updated = [...groups]
                    updated[groupIndex].name = e.target.value
                    onUpdateGroups(updated)
                  }}
                  className="font-medium"
                  placeholder="Product name"
                />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Category:</span>
                  <Input
                    value={group.category}
                    onChange={(e) => {
                      const updated = [...groups]
                      updated[groupIndex].category = e.target.value
                      onUpdateGroups(updated)
                    }}
                    className="h-8 text-sm max-w-xs"
                  />
                </div>

                {/* Other Images */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {group.images.length} image{group.images.length !== 1 ? "s" : ""}:
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {group.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${group.name} ${idx + 1}`}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function ProcessingStep({
  groups,
  isProcessing,
}: {
  groups: ProductGroup[]
  isProcessing: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">AI Image Processing</h3>
        <p className="text-sm text-muted-foreground">
          Creating background-removed and lifestyle variants for each image
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={group.id} className="space-y-3">
            <h4 className="font-medium">{group.name}</h4>

            {group.processedImages?.map((img, imgIndex) => (
              <div
                key={imgIndex}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="grid grid-cols-3 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Original</p>
                    <img
                      src={img.original}
                      alt="Original"
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  </div>

                  {/* Background Removed */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Background Removed
                    </p>
                    <div className="relative w-full aspect-square rounded-lg border bg-muted overflow-hidden">
                      {img.background_removed ? (
                        <img
                          src={img.background_removed}
                          alt="Background Removed"
                          className="w-full h-full object-cover"
                        />
                      ) : img.status === "processing" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <Sparkles className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lifestyle */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Lifestyle Shot
                    </p>
                    <div className="relative w-full aspect-square rounded-lg border bg-muted overflow-hidden">
                      {img.lifestyle ? (
                        <img
                          src={img.lifestyle}
                          alt="Lifestyle"
                          className="w-full h-full object-cover"
                        />
                      ) : img.status === "processing" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <Sparkles className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {img.status === "completed" && (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Completed</span>
                    </>
                  )}
                  {img.status === "processing" && (
                    <>
                      <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                      <span className="text-violet-500">Processing...</span>
                    </>
                  )}
                  {img.status === "failed" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">Failed</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DetailsStep({
  details,
  groups,
  onUpdateDetails,
}: {
  details: ProductDetails[]
  groups: ProductGroup[]
  onUpdateDetails: (details: ProductDetails[]) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Product Details</h3>
        <p className="text-sm text-muted-foreground">
          Review and edit product details before creating
        </p>
      </div>

      <div className="space-y-6">
        {details.map((product, index) => {
          const group = groups.find(g => g.id === product.groupId)
          if (!group) return null

          return (
            <motion.div
              key={product.groupId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border bg-card space-y-4"
            >
              {/* Product Images Preview */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.selectedImages.slice(0, 6).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
                  />
                ))}
                {product.selectedImages.length > 6 && (
                  <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                    +{product.selectedImages.length - 6} more
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={product.name}
                  onChange={(e) => {
                    const updated = [...details]
                    updated[index].name = e.target.value
                    onUpdateDetails(updated)
                  }}
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={product.description}
                  onChange={(e) => {
                    const updated = [...details]
                    updated[index].description = e.target.value
                    onUpdateDetails(updated)
                  }}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (USD)</label>
                  <Input
                    type="number"
                    value={product.price}
                    onChange={(e) => {
                      const updated = [...details]
                      updated[index].price = e.target.value
                      onUpdateDetails(updated)
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={product.category}
                    onChange={(e) => {
                      const updated = [...details]
                      updated[index].category = e.target.value
                      onUpdateDetails(updated)
                    }}
                  />
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Sizes</label>
                <div className="flex gap-2">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <Button
                      key={size}
                      variant={product.sizes.includes(size) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updated = [...details]
                        if (product.sizes.includes(size)) {
                          updated[index].sizes = product.sizes.filter(s => s !== size)
                        } else {
                          updated[index].sizes = [...product.sizes, size]
                        }
                        onUpdateDetails(updated)
                      }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <div className="flex gap-2">
                  {(["men", "women", "unisex"] as const).map((gender) => (
                    <Button
                      key={gender}
                      variant={product.gender === gender ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updated = [...details]
                        updated[index].gender = gender
                        onUpdateDetails(updated)
                      }}
                      className="capitalize"
                    >
                      {gender}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function CreatingStep({
  isProcessing,
  productsCount,
}: {
  isProcessing: boolean
  productsCount: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-12"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-16 w-16 text-violet-500 animate-spin mb-4" />
          <p className="text-xl font-medium">Creating {productsCount} products...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a moment
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xl font-medium">Products Created Successfully!</p>
          <p className="text-sm text-muted-foreground mt-2">
            {productsCount} draft products have been added
          </p>
        </>
      )}
    </motion.div>
  )
}
