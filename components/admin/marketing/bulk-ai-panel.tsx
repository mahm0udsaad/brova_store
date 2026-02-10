"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Languages,
  Search as SearchIcon,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BulkAIPanelProps {
  storeId: string
  products: Array<{ id: string; name: string }>
}

type OperationType =
  | "description_generation"
  | "translation"
  | "seo_generation"
  | "alt_text_generation"

export function BulkAIPanel({ storeId, products }: BulkAIPanelProps) {
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [targetLanguage, setTargetLanguage] = useState<"ar" | "en">("ar")
  const [tone, setTone] = useState<"professional" | "casual" | "luxurious">("professional")
  const [isProcessing, setIsProcessing] = useState(false)
  const [operationStatus, setOperationStatus] = useState<any>(null)

  const operations = [
    {
      id: "description_generation" as OperationType,
      title: "Generate Descriptions",
      description: "Create engaging product descriptions in Arabic and English",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "translation" as OperationType,
      title: "Translate Products",
      description: "Translate product content between Arabic and English",
      icon: Languages,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "seo_generation" as OperationType,
      title: "Generate SEO Metadata",
      description: "Create meta titles, descriptions, and keywords",
      icon: SearchIcon,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "alt_text_generation" as OperationType,
      title: "Generate Alt Text",
      description: "Create accessible image descriptions using AI vision",
      icon: ImageIcon,
      color: "from-orange-500 to-red-500",
    },
  ]

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleStartOperation = async () => {
    if (!selectedOperation || selectedProducts.length === 0) {
      alert("Please select an operation and at least one product")
      return
    }

    setIsProcessing(true)
    setOperationStatus({ status: "processing", progress: 0 })

    try {
      // TODO: Create unified bulk operations API endpoint
      // For now, we'll show a mock loading state
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setOperationStatus({
        status: "completed",
        progress: 100,
        successCount: selectedProducts.length,
        failedCount: 0,
      })

      alert(`Successfully processed ${selectedProducts.length} products!`)
      setSelectedProducts([])
      setSelectedOperation(null)
    } catch (error: any) {
      console.error("Bulk operation error:", error)
      setOperationStatus({
        status: "failed",
        error: error.message,
      })
      alert(error.message || "Operation failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!selectedOperation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold mb-1">Bulk AI Operations</h2>
          <p className="text-sm text-muted-foreground">
            Process multiple products at once using AI
          </p>
        </div>

        {/* Operation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map((operation, index) => {
            const Icon = operation.icon
            return (
              <motion.button
                key={operation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedOperation(operation.id)}
                className="group relative overflow-hidden rounded-lg border-2 border-dashed hover:border-primary p-6 text-left transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" />
                <div
                  className={cn(
                    "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br",
                    operation.color
                  )}
                />
                <div className="relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                      operation.color
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{operation.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {operation.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Start Operation
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  const currentOperation = operations.find((op) => op.id === selectedOperation)!

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setSelectedOperation(null)}
          variant="outline"
          size="sm"
        >
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{currentOperation.title}</h2>
          <p className="text-sm text-muted-foreground">
            {currentOperation.description}
          </p>
        </div>
      </div>

      {/* Operation Configuration */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-medium mb-3">Configuration</h3>

        {selectedOperation === "translation" && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Target Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as "ar" | "en")}
              className="w-full px-4 py-2 rounded-lg border bg-background"
            >
              <option value="ar">Translate to Arabic</option>
              <option value="en">Translate to English</option>
            </select>
          </div>
        )}

        {selectedOperation === "description_generation" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Tone</label>
            <select
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as "professional" | "casual" | "luxurious")
              }
              className="w-full px-4 py-2 rounded-lg border bg-background"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual & Friendly</option>
              <option value="luxurious">Luxurious & Premium</option>
            </select>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">
              Select Products ({selectedProducts.length} selected)
            </label>
            <Button onClick={handleSelectAll} variant="outline" size="sm">
              {selectedProducts.length === products.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
            {products.slice(0, 50).map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleToggleProduct(product.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">{product.name}</span>
              </label>
            ))}
            {products.length > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Showing first 50 products
              </p>
            )}
          </div>
        </div>

        {operationStatus && operationStatus.status === "processing" && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Processing...
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${operationStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        {operationStatus && operationStatus.status === "completed" && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  Operation Completed
                </div>
                <div className="text-sm text-muted-foreground">
                  {operationStatus.successCount} products processed successfully
                </div>
              </div>
            </div>
          </div>
        )}

        {operationStatus && operationStatus.status === "failed" && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-red-600 dark:text-red-400">
                  Operation Failed
                </div>
                <div className="text-sm text-muted-foreground">
                  {operationStatus.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleStartOperation}
          disabled={isProcessing || selectedProducts.length === 0}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing {selectedProducts.length} products...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start Processing {selectedProducts.length} products
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
